import { appReducer } from "./AppReducer";

const rootReducer =(state,action)=>{
    if(action.type==="auth/logout"){
        state =undefined;
    }

    return appReducer(state,action)
}

export default rootReducer