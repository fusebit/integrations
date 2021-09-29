import React from 'react';
import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  FormControlLabel,
  FormGroup,
  Switch,
  Typography,
} from '@mui/material';
import { IntegrationType } from './Types';

const IntegrationCard = (props: {
  integration: IntegrationType;
  isInstalled: boolean;
  isActive: boolean;
  onUninstall: Function;
}) => {
  const capitalize = (string: string) => string[0].toUpperCase() + string.slice(1).toLowerCase();
  const bodyTextMap: Record<IntegrationType, string> = {
    [IntegrationType.slack]: 'Get slack notifications when a new task is created.',
    [IntegrationType.hubspot]: 'Sync your hubspot task list here.',
  };

  const installApp = () => (window.location.href = `/api/integration/install`);
  const setIntegrationStatus = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('switch clicked');
    const status = event.target.checked;
    const response = await fetch('{{APP_URL}}/api/integration/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ status }),
    });
    const tenantData = await response.json();
    props.onUninstall(tenantData);
  };

  const ToggleSwitch = () => (
    <Switch checked={props.isActive} onChange={setIntegrationStatus} disabled={!props.isInstalled} />
  );
  const ActiveToggle = () => (
    <FormGroup>
      <FormControlLabel control={<ToggleSwitch />} label={props.isActive ? 'Active' : 'Inactive'} />
    </FormGroup>
  );

  return (
    <Card className="integration-card">
      <CardActionArea>
        <CardMedia
          className="integration-media"
          image={`/static/${props.integration}.png`}
          title={capitalize(props.integration)}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="h2">
            {capitalize(props.integration)}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            {bodyTextMap[props.integration]}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions>
        <ActiveToggle />
        <span className="spacer" />
        <Button variant="contained" color={props.isInstalled ? 'primary' : 'secondary'} onClick={installApp}>
          {props.isInstalled ? 'Re-Install' : 'Install'}
        </Button>
      </CardActions>
    </Card>
  );
};
export default IntegrationCard;
