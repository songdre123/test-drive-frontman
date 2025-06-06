import { configureStore } from '@reduxjs/toolkit';

const initialState = {
  dragState: null
};

const dragReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_DRAG_STATE':
      return {
        ...state,
        dragState: action.payload
      };
    default:
      return state;
  }
};

const store = configureStore({
  reducer: {
    drag: dragReducer
  }
});

export default store; 