import '@testing-library/jest-dom';

global.alert = jest.fn();

if (!global.fetch) {
  global.fetch = jest.fn();
}
