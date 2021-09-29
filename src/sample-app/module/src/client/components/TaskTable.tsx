import React from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Task } from './Types';

const TaskTable = (props: { tasks: Task[] }) => {
  const tasks = props.tasks.map((task, index) => ({ ...task, index }));
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Task Id</TableCell>
            <TableCell>Task Name</TableCell>
            <TableCell align="left">Task Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks?.reverse().map((task, index) => (
            <TableRow key={task.index}>
              <TableCell component="th" scope="row">
                {task.index + 1}
              </TableCell>
              <TableCell component="th" scope="row">
                {task.name}
              </TableCell>
              <TableCell align="left">{task.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TaskTable;
