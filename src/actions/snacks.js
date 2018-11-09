import {
  SNACKS_SHIFT,
  SNACKS_ADD,
} from './types';

export const shiftSnacks = () => ({
  type: SNACKS_SHIFT,
});

export const addSnack = (snack) => ({
  type: SNACKS_ADD,
  snack,
});
