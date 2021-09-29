import {BrowserRouter as Router, Route, Switch, useLocation, RouteProps} from "react-router-dom";
import Dashboard from "./Dashboard";
import Login from "./Login";
import React, {useEffect, useState} from "react";
import Frame from "./Frame";
import {Tenant, TenantData} from "./Types";
import Marketplace from "./Marketplace";
import {CircularProgress, Fade} from "@mui/material";

const AppRouter = () => (
        <Router>
            <Routes/>
        </Router>
    );

const AuthedRoute = (props: {onLogin: Function, tenantData: TenantData} & RouteProps) => {
    if(props.tenantData?.currentTenantId) {
        return <Route {...props} />
    }
    return <Login onLogin={props.onLogin} tenantData={props.tenantData}/>
};

const Routes = () => {
    const [tenantData, setTenantData] = useState<TenantData | undefined>();
    const [refreshFlag, setRefreshFlag] = useState<boolean>(true);
    const [hasLoaded, setHasLoaded] = useState<boolean>(false);

    useEffect(() => {
        console.log('refreshing tenants');
        if (!setRefreshFlag) {
            return;
        }
        let mounted = true;
        fetch('{{APP_URL}}/api/tenants')
            .then(response => response.json())
            .then(tenantData => {
                console.log('saving tenants')
                if (mounted) {
                    setTenantData(tenantData);
                    setRefreshFlag(false);
                    setHasLoaded(true);
                }
            })
            .catch(console.log)
        return () => {
            mounted = false
        };
    }, [refreshFlag]);
    if (!hasLoaded) {
        return (
            <Fade
                in
                style={{
                    transitionDelay: '800ms',
                }}
                unmountOnExit
                timeout={1000}
            >
                <CircularProgress size="400" style={{margin: "auto", display: "flex", padding: 20}}/>
            </Fade>
        );
    }


    const handleLogin = async (tenant: Tenant) => {
        const response = await fetch(
            '{{APP_URL}}/api/tenants/login',
            {
                body: JSON.stringify(tenant),
                method: 'POST',
                headers: {
                    "Content-Type":"application/json; charset=utf-8"
                },
            });
        const tenantData = await response.json();
        setTenantData(tenantData);
    }

    const handleLogout = async () => {
        await fetch('{{APP_URL}}/api/tenants/logout', {method: 'DELETE'});
        setRefreshFlag(true);
    }

    const AuthedRouteWithProps = (props: {path: string} & RouteProps) =>
        <AuthedRoute
            {...props}
            onLogin={handleLogin}
            tenantData={tenantData}
        />

    const FrameWithProps = (props: RouteProps) =>
        <Frame
            {...props}
            onLogout={handleLogout}
            tenantData={tenantData}
        />

    const handleUninstall = (tenantData: TenantData) => setTenantData(tenantData);
    const currentTenant = tenantData?.tenants?.find(tenant => tenant.tenantId === tenantData.currentTenantId);

    return (
        <Switch>
            <AuthedRouteWithProps path="/marketplace">
                <FrameWithProps>
                    <Marketplace tenantData={tenantData} onUninstall={handleUninstall}/>
                </FrameWithProps>
            </AuthedRouteWithProps>
            <AuthedRouteWithProps path="/" >
                <FrameWithProps>
                    <Dashboard isInstalled={currentTenant?.integrationInstalled} isActive={currentTenant?.integrationActivated}/>
                </FrameWithProps>
            </AuthedRouteWithProps>
        </Switch>
    );
}

export default AppRouter;