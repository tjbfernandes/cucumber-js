require('../../support/spec_helper');

describe("Cucumber.Ast.Scenario", function() {
  var Cucumber = requireLib('cucumber');
  var steps;
  var scenario, keyword, name, description, line, lastStep;

  beforeEach(function() {
    keyword     = createSpy("scenario keyword");
    name        = createSpy("scenario name");
    description = createSpy("scenario description");
    line        = createSpy("starting scenario line number");
    lastStep    = createSpy("last step");
    steps       = createSpy("step collection");
    spyOnStub(steps, 'add');
    spyOnStub(steps, 'getLast').andReturn(lastStep);
    spyOn(Cucumber.Type, 'Collection').andReturn(steps);
    scenario = Cucumber.Ast.Scenario(keyword, name, description, line);
  });

  describe("constructor", function() {
    it("creates a new collection to store steps", function() {
      expect(Cucumber.Type.Collection).toHaveBeenCalled();
    });
  });

  describe("getKeyword()", function() {
    it("returns the keyword of the scenario", function() {
      expect(scenario.getKeyword()).toBe(keyword);
    });
  });

  describe("getName()", function() {
    it("returns the name of the scenario", function() {
      expect(scenario.getName()).toBe(name);
    });
  });

  describe("getDescription()", function() {
    it("returns the description of the scenario", function() {
      expect(scenario.getDescription()).toBe(description);
    });
  });

  describe("getLine()", function() {
    it("returns the line on which the scenario starts", function() {
      expect(scenario.getLine()).toBe(line);
    });
  });

  describe("getBackground() [setBackground()]", function() {
    it("returns the background that was set as such", function() {
      var background = createSpy("background");
      scenario.setBackground(background);
      expect(scenario.getBackground()).toBe(background);
    });
  });

  describe("addStep()", function() {
    var step, lastStep;

    beforeEach(function() {
      step = createSpyWithStubs("step AST element", {setPreviousStep: null});
      lastStep = createSpy("last step");
      spyOn(scenario, 'getLastStep').andReturn(lastStep);
    });

    it("gets the last step", function() {
      scenario.addStep(step);
      expect(scenario.getLastStep).toHaveBeenCalled();
    });

    it("sets the last step as the previous step", function() {
      scenario.addStep(step);
      expect(step.setPreviousStep).toHaveBeenCalledWith(lastStep);
    });

    it("adds the step to the steps (collection)", function() {
      scenario.addStep(step);
      expect(steps.add).toHaveBeenCalledWith(step);
    });
  });

  describe("getLastStep()", function() {
    it("gets the last step from the collection", function() {
      scenario.getLastStep();
      expect(steps.getLast).toHaveBeenCalled();
    });

    it("returns that last step from the collection", function() {
      expect(scenario.getLastStep()).toBe(lastStep);
    });
  });

  describe("getTags() [setTags()]", function() {
    it("returns the tags", function() {
      var tags = createSpy("tags");
      scenario.setTags(tags);
      expect(scenario.getTags()).toBe(tags);
    });
  });

  describe("acceptVisitor", function() {
    var visitor, callback;

    beforeEach(function() {
      visitor  = createSpyWithStubs("Visitor", {visitStep: null});
      callback = createSpy("Callback");
      spyOn(scenario, 'instructVisitorToVisitBackgroundSteps');
      spyOn(scenario, 'instructVisitorToVisitScenarioSteps');
    });

    it("instructs the visitor to visit the background steps", function() {
      scenario.acceptVisitor(visitor, callback);
      expect(scenario.instructVisitorToVisitBackgroundSteps).toHaveBeenCalledWithValueAsNthParameter(visitor, 1);
      expect(scenario.instructVisitorToVisitBackgroundSteps).toHaveBeenCalledWithAFunctionAsNthParameter(2);
    });

    describe("when the visitor has finished visiting the background steps", function() {
      var backgroundStepsVisitCallback;

      beforeEach(function() {
        scenario.acceptVisitor(visitor, callback);
        backgroundStepsVisitCallback = scenario.instructVisitorToVisitBackgroundSteps.mostRecentCall.args[1];
      });

      it("instructs the visitor to visit the scenario steps", function() {
        backgroundStepsVisitCallback();
        expect(scenario.instructVisitorToVisitScenarioSteps).toHaveBeenCalledWith(visitor, callback);
      });
    });
  });

  describe("instructVisitorToVisitBackgroundSteps()", function() {
    var visitor, callback, backgroundSteps;

    beforeEach(function() {
      visitor         = createSpyWithStubs("Visitor", {visitStep: null});
      callback        = createSpy("Callback");
      spyOn(scenario, 'getBackground');
    });

    it("gets the background", function() {
      scenario.instructVisitorToVisitBackgroundSteps(visitor, callback);
      expect(scenario.getBackground).toHaveBeenCalled();
    });

    describe("when there is a background", function() {
      beforeEach(function() {
        backgroundSteps = createSpy("background steps");
        background      = createSpyWithStubs("background", {getSteps: backgroundSteps});
        scenario.getBackground.andReturn(background);
        spyOn(scenario, 'instructVisitorToVisitSteps');
      });

      it("gets the steps from the background", function() {
        scenario.instructVisitorToVisitBackgroundSteps(visitor, callback);
        expect(background.getSteps).toHaveBeenCalled();
      });

      it("instructs the visitor to visit the background steps and callback", function() {
        scenario.instructVisitorToVisitBackgroundSteps(visitor, callback);
        expect(scenario.instructVisitorToVisitSteps).toHaveBeenCalledWith(visitor, backgroundSteps, callback);
      });

      it("does not callback", function() {
        scenario.instructVisitorToVisitBackgroundSteps(visitor, callback);
        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe("when there is no background", function() {
      beforeEach(function() {
        scenario.getBackground.andReturn(undefined);
      });

      it("calls back", function() {
        scenario.instructVisitorToVisitBackgroundSteps(visitor, callback);
        expect(callback).toHaveBeenCalled();
      });
    });
  });

  describe("instructVisitorToVisitScenarioSteps()", function() {
    var visitor, callback;

    beforeEach(function() {
      visitor  = createSpyWithStubs("Visitor", {visitStep: null});
      callback = createSpy("Callback");
      spyOn(scenario, 'instructVisitorToVisitSteps');
    });

    it("instructs the visitor to visit the steps", function() {
      scenario.instructVisitorToVisitScenarioSteps(visitor, callback);
      expect(scenario.instructVisitorToVisitSteps).toHaveBeenCalledWith(visitor, steps, callback);
    });
  });

  describe("instructVisitorToVisitSteps()", function() {
    var visitor, steps, callback;

    beforeEach(function() {
      visitor  = createSpyWithStubs("visitor", {visitStep: null});
      callback = createSpy("callback");
      steps    = createSpy("steps");
      spyOnStub(steps, 'forEach');
   });

    it("iterates over the steps with a user function", function() {
      scenario.instructVisitorToVisitSteps(visitor, steps, callback);
      expect(steps.forEach).toHaveBeenCalled();
      expect(steps.forEach).toHaveBeenCalledWithAFunctionAsNthParameter(1);
      expect(steps.forEach).toHaveBeenCalledWithValueAsNthParameter(callback, 2);
    });

    describe("for each step", function() {
      var userFunction, step, forEachCallback;

      beforeEach(function() {
        scenario.instructVisitorToVisitSteps(visitor, steps, callback);
        userFunction    = steps.forEach.mostRecentCall.args[0];
        step            = createSpy("a step");
        forEachCallback = createSpy("forEach() callback");
      });

      it("instructs the visitor to visit the step and call back when finished", function() {
        userFunction(step, forEachCallback);
        expect(visitor.visitStep).toHaveBeenCalledWith(step, forEachCallback);
      });
    });
  });
});
