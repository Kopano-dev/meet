/* global module */

const JSDOMEnvironment = require('jest-environment-jsdom');

// Mocks.
class MockMediaStream {}

// Environment.
class MeetEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context);

    // Add mocks.
    this.global.MediaStream = MockMediaStream;
  }
}

module.exports = MeetEnvironment;
