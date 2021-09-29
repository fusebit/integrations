import * as React from 'react';
import {Stack, Snackbar, Alert as MuiAlert} from '@mui/material';
import {ForwardedRef, useEffect} from "react";

const Alert = React.forwardRef((props: React.ComponentProps<typeof MuiAlert>, ref: ForwardedRef<HTMLDivElement>) => {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const IntegrationFeedback = (props: React.PropsWithChildren<{text: string, severity: "error" | "warning" | "info" | "success"}>) => {
    const [open, setOpen] = React.useState(false);
    useEffect(() => {
        if (!!props.text) {
            setOpen(true);
        }
    }, [props]);

    const handleClose = (event: React.SyntheticEvent<Element, Event>) => {
        setOpen(false);
    };

    return (
        <React.Fragment>
            <Stack spacing={2} sx={{ width: '100%' }}>
                <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                    <Alert onClose={handleClose} severity={props.severity} sx={{ width: '100%' }}>
                        {props.text}
                    </Alert>
                </Snackbar>
            </Stack>
        </React.Fragment>
    );
}

export default IntegrationFeedback;