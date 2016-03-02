import { createSelector } from 'reselect';

export const errorMessages = state => state.app.errors.messages;

export default createSelector(
  errorMessages,
  (errorMessages) => {
    return {
      errorMessages,
    }
  }
);
