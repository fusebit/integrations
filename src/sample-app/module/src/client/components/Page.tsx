import React from 'react';
import {Grid} from "@mui/material";

export default (props: React.PropsWithChildren<{}>) => (
    <Grid container className="container-buffer">
        {props.children}
    </Grid>
)