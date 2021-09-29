import React from 'react';
import Page from "./Page";
import PageItem from "./PageItem";
import StatusPaper from "./StatusPaper";
import {Grid, Typography} from "@mui/material";
import IntegrationCard from "./IntegrationCard";
import {IntegrationType, TenantData} from "./Types";

const Marketplace = (props: {tenantData: TenantData, onUninstall: Function}) => {
    const currentTenant = props.tenantData.tenants.find(tenant => tenant.tenantId === props.tenantData.currentTenantId);
    const isInstalled = currentTenant.integrationInstalled;
    const isActive = currentTenant.integrationActivated;
    console.log(currentTenant);
    return (
        <Page>
            <PageItem>
                <StatusPaper elevation={24}>
                    <Typography>Fusebit handles Authentification for you!</Typography>
                    <p>Fusebit handles all the overhead of authenticating tenants and wiring up their configurations to a specific install for you.  Once you've installed the app, <strong>head on over the the fusebit management portal</strong> to see it.</p>
                    <p>Note: This sample app is currently limited to one integratino for demonstration purposes.</p>
                </StatusPaper>
            </PageItem>
            <PageItem>
                <Typography>Available Integrations</Typography>
            </PageItem>
            <PageItem>
                <Grid container spacing={2}>
                    <Grid item xs={4}>
                        <IntegrationCard
                            onUninstall={props.onUninstall}
                            integration={IntegrationType.slack}
                            isInstalled={isInstalled}
                            isActive={isActive}
                        />
                    </Grid>
                    <Grid item xs={2}/>
                    <Grid item xs={4}>
                        <IntegrationCard
                            onUninstall={() => ({})}
                            integration={IntegrationType.hubspot}
                            isInstalled={false}
                            isActive={false}
                        />
                    </Grid>
                </Grid>
            </PageItem>
        </Page>
    )
}

export default Marketplace;