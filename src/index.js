import React from "react";
import * as ReactDOM from "react-dom";

const createStore = (reducer, initialState = {}) => {
  let currentState = initialState;
  let listeners = [];

  const getState = () => currentState;

  const dispatch = (action) => {
    currentState = reducer(currentState, action);

    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener) => listeners.push(listener);

  return {
    getState,
    dispatch,
    subscribe,
  };
};

const context = React.createContext({});

const isEqual = (current, prev) => current === prev;

const useSelector = (selector, compareFn = isEqual) => {
  const ctx = React.useContext(context);

  const getValue = React.useCallback((ctx) => selector(ctx.store.getState()), [selector]);

  const [value, setValue] = React.useState(getValue(ctx));

  React.useEffect(() => {
    const subscriber = () => {
      const next = getValue(ctx);

      setValue((prev) => {
        if (!compareFn(prev, next)) {
          return next;
        }

        return prev;
      });
    };

    ctx.store.subscribe(subscriber);
  }, [compareFn, getValue, ctx]);

  return value;
};

const useDispatch = () => {
  const ctx = React.useContext(context);

  return ctx.store.dispatch;
};

const Provider = ({ store, children }) => {
  const Context = context;

  return <Context.Provider value={{ store }}>{children}</Context.Provider>;
};

// APP

// actions
const UPDATE_COUNTER = "UPDATE_COUNTER";
const CHANGE_STEP_SIZE = "CHANGE_STEP_SIZE";

// action creators
const updateCounter = (value) => ({
  type: UPDATE_COUNTER,
  payload: value,
});

const changeStepSize = (value) => ({
  type: CHANGE_STEP_SIZE,
  payload: value,
});

// reducers
const defaultState = {
  counter: 1,
  stepSize: 1,
};

const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case UPDATE_COUNTER:
      return { ...state, counter: state.counter + action.payload };
    case CHANGE_STEP_SIZE:
      return { ...state, stepSize: action.payload };
    default:
      return state;
  }
};

// selectors
const counterSelector = (state) => state.counter;
const stepSelector = (state) => state.stepSize;

// lib
const toNumber = (value) => ~~value;

// Components
const Counter = () => {
  const counter = useSelector(counterSelector);
  const stepSize = useSelector(stepSelector);
  const dispatch = useDispatch();

  const add = () => dispatch(updateCounter(toNumber(stepSize)));
  const sub = () => dispatch(updateCounter(-toNumber(stepSize)));

  return (
    <div>
      <button onClick={sub}>-</button>
      <span> {counter} </span>
      <button onClick={add}>+</button>
    </div>
  );
};

const Step = () => {
  const stepSize = useSelector(stepSelector);
  const dispatch = useDispatch();

  const handleChange = (e) => dispatch(changeStepSize(e.target.value));

  return (
    <div>
      <div>Значение счётчика должно увеличиваться или уменьшаться на заданную величину шага</div>
      <div>Текущая величина шага: {stepSize}</div>
      <input type="range" min="1" max="5" value={stepSize} onChange={handleChange} />
    </div>
  );
};

const store = createStore(reducer, defaultState);

ReactDOM.render(
  <Provider store={store}>
    <Step />
    <Counter />
  </Provider>,
  document.getElementById("app")
);
