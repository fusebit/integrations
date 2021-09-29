import {Button, Grid, TextField} from "@mui/material";
import {Task} from "./Types";
import React, {useState} from "react";
import SlackAction from "./SlackAction";

const TaskInput = (props: {onTaskCreated: (task: Task) => void, isInstalled: boolean, isActive: boolean}) => {
    const [task, setTask] = useState<Task>({name: '', description: ''})
    const handleAddTask = async () => {
        props.onTaskCreated(task);
        setTask({name: '', description: ''});
    }

    const handleChange = (field: string) => (event: any) => {
        setTask({...task, [field]: event.target.value});
        console.log(task);
    }

    return (
        <Grid container spacing={2}>
            <Grid item xs={4}>
                <TextField label="Task Name" variant="filled" fullWidth onChange={handleChange('name')} value={task.name}/>
            </Grid>
            <Grid item xs={4}>
                <TextField label="Task Description" variant="filled" fullWidth onChange={handleChange('description')} value={task.description}/>
            </Grid>
            <Grid item xs={2}>
                <Button variant="contained" color="primary" onClick={handleAddTask}>Add New Task</Button>
            </Grid>
            <Grid item xs={2}>
                <SlackAction isInstalled={props.isInstalled} isActive={props.isActive}/>
            </Grid>

        </Grid>
    )
};

export default TaskInput;