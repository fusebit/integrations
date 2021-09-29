import React from 'react';
import {Grid} from "@mui/material";

export default (props: React.PropsWithChildren<{}>) => (
    <React.Fragment>
        <Grid item xs={1}/>
        <Grid item xs={10}>
            {props.children}
        </Grid>
        <Grid item xs={1}/>
    </React.Fragment>
)