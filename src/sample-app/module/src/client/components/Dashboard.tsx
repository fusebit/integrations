import { Task } from './Types';
import StatusPaper from './StatusPaper';
import { CircularProgress, Fade, Typography } from '@mui/material';
import TaskInput from './TaskInput';
import React, { useEffect, useState } from 'react';
import TaskTable from './TaskTable';
import PageItem from './PageItem';
import Page from './Page';
import IntegrationFeedback from './IntegrationFeedback';

export default (props: { isInstalled: boolean; isActive: boolean }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshFlag, setRefreshFlag] = useState<boolean>(true);
  const [alertProps, setAlertProps] = useState<{ text: string; severity: 'error' | 'warning' | 'info' | 'success' }>();
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);
  useEffect(() => {
    if (!refreshFlag) {
      return;
    }
    let mounted = true;
    fetch('{{APP_URL}}/api/task', {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
      .then((response) => response.json())
      .then((tasks) => {
        if (mounted) {
          setTasks(tasks);
          setRefreshFlag(false);
          setHasLoaded(true);
        }
      })
      .catch(console.log);
    return () => {
      mounted = false;
    };
  }, [refreshFlag]);

  const saveTask = async (task: Task) => {
    const response = await fetch('{{APP_URL}}/api/task', {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'POST',
      body: JSON.stringify(task),
    });
    setTasks(await response.json());
    alert();
  };

  const alert = () => {
    const installedSeverity = props.isActive ? 'success' : 'info';
    const severity = props.isInstalled ? installedSeverity : 'warning';

    const installedMessage = props.isActive
      ? 'A message is being sent to your slack account.'
      : 'Enable the installed Slack integration to receive messages';
    const message = props.isInstalled
      ? installedMessage
      : 'Head to the Integration Marketplace to install the Slack Integration';

    setAlertProps({ severity, text: message });
  };

  const Body = () =>
    hasLoaded ? (
      <TaskTable tasks={tasks} />
    ) : (
      <Fade
        in
        style={{
          transitionDelay: '800ms',
        }}
        unmountOnExit
        timeout={1000}
      >
        <CircularProgress size="400" style={{ margin: 'auto', display: 'flex', padding: 20 }} />
      </Fade>
    );

  return (
    <Page>
      <PageItem>
        <StatusPaper elevation={24}>
          <Typography>Fusebit Integrations in Action!</Typography>
          <p>
            Fusebit automatically checks if the specific user (or tenant) has installed the integration in their
            account. You can use this information to enable / disable different actions in the system.
          </p>
          <p>
            In this example, the "Add New Task" Button, if installed, will use your integration code to immediately
            update your tenant via Slack! Look at the code to see how it works, and learn more in the docs here.
          </p>
        </StatusPaper>
      </PageItem>
      <PageItem>
        <TaskInput onTaskCreated={saveTask} isInstalled={props.isInstalled} isActive={props.isActive} />
      </PageItem>
      <PageItem>
        <Body />
      </PageItem>
      <IntegrationFeedback {...alertProps} />
    </Page>
  );
};
