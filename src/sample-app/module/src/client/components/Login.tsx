import React from "react";
import StatusPaper from "./StatusPaper";
import {Avatar, Grid, List, ListItem, ListItemIcon, ListItemText, Paper} from "@mui/material";
import {Tenant, TenantData} from "./Types";

export default (props: {onLogin: Function, tenantData: TenantData}) => {
    const handleLogin = (tenant: Tenant) => async () => {
        props.onLogin({
            tenants: tenants,
            currentTenantId: tenant.tenantId,
        });
    }

    const tenants: Tenant[] = props.tenantData?.tenants || [
        {
            tenantId: Math.round(Math.random()*100000),
            name: "Tenant 1",
            index: 0,
            integrationInstalled: false,
            integrationActivated: false,
            tasks: []
        },
        {
            tenantId: Math.round(Math.random()*100000),
            name: "Tenant 2",
            index: 1,
            integrationInstalled: false,
            integrationActivated: false,
            tasks: []
        },
        {
            tenantId: Math.round(Math.random()*100000),
            name: "Tenant 3",
            index: 2,
            integrationInstalled: false,
            integrationActivated: false,
            tasks: []
        },
        {
            tenantId: Math.round(Math.random()*100000),
            name: "Tenant 4",
            index: 3,
            integrationInstalled: false,
            integrationActivated: false,
            tasks: []
        },
    ];

    return (
        <Grid container justifyContent="center" spacing={1}>
            <Grid item xs={8}>
                    <StatusPaper elevation={24}>
                        <React.Fragment>
                            <h1>Welcome to the Fusebit Sample App!</h1>
                            <p>Fusebit provides multi-tenancy out of box, we've mocked out four tenants for you in this sample app so you can see it in action.  Log in to get started and <strong>don't forget to follow along in the code in your favorite editor</strong>!</p>
                        </React.Fragment>
                    </StatusPaper>
            </Grid>
            <Grid item xs={12}/>
            <Grid item xs={4}>
                    <Paper style={{borderRadius: 25}}>
                        <List>
                            {tenants.map((tenant, index) => (
                                <ListItem button onClick={handleLogin(tenant)} key={index}>
                                    <ListItemIcon>
                                        <Avatar>{tenant.index + 1}</Avatar>
                                    </ListItemIcon>
                                    <ListItemText>
                                        {tenant.name}
                                    </ListItemText>
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
            </Grid>
        </Grid>
    );
}