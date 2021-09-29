import React from 'react';
import {Paper} from "@mui/material";

const StatusPaper =  (props: any) => {
    const paperProps: object = {...props};
    return <Paper square  {...paperProps}>
        <div style={{
            padding: '10px',
            border: '0px',
            borderLeft: '8px',
            borderStyle: 'solid',
            borderColor: props.color || 'black'}}
        >
            {props.children}
        </div>
    </Paper>
}
export default StatusPaper;