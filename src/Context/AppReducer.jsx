export default (state, action) => {
  switch (action.type) {
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.payload
        ),
      };
    case "CREATE_TRANSACTION":
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case "SET_LOCALSTORAGE_VALUE":
      return {
        ...state,
        transactions: [...action.payload],
      };

    default:
      return state;
  }
};
