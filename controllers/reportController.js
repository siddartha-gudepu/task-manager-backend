const Task = require('../models/Task');
const User = require('../models/User');
const excelJS = require('exceljs');

const exportTasksReport=async(req,res)=>{
    try{
        const tasks=await Task.find().populate("assignedTo","name email");
        const workbook =new excelJS.Workbook();
        const worksheet=workbook.addWorksheet("Tasks Report");
        worksheet.columns=[
            {header:"Task ID",key:"_id",width:25},
            {header:"Title",key:"title",width:30},
            {header:"Description",key:"description",width:50},
            {header:"Priority",key:"priority",width:15},
            {header:"Status",key:"status",width:15},
            {header:"Due Date",key:"dueDate",width:20},
            {header:"Assigned To",key:"assignedTo",width:30},
        ]
        tasks.forEach(task=>{
            const assignedTo=task.assignedTo.map(user=>`${user.name} (${user.email})`).join(", ");
            worksheet.addRow({
                _id:task._id.toString(),
                title:task.title,
                description:task.description,
                priority:task.priority,
                status:task.status,
                dueDate:task.dueDate.toISOString().split("T")[0],
                assignedTo:assignedTo || "Unassigned",
            });
        });
        res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition","attachment; filename=tasks_report.xlsx");
        return workbook.xlsx.write(res).then(()=>{
            res.end();
        });
    }catch(error){
        res.status(500).json({message:"Server error",error:error.message});
    }
}

const exportUsersReport=async(req,res)=>{
    try{
        const users=await User.find().select("name email _id").lean();
        const userTasks=await Task.find().populate("assignedTo","name email _id");
        const userTaskmap={};
        users.forEach(user=>{
            userTaskmap[user._id]={name:user.name,email:user.email,taskCount:0,pendingTasks:0,inProgressTasks:0,completedTasks:0};
        });
        userTasks.forEach(task=>{
            if(task.assignedTo){
                task.assignedTo.forEach(assignedUser=>{
                    if(userTaskmap[assignedUser._id]){
                        userTaskmap[assignedUser._id].taskCount++;
                        if(task.status==="Pending"){
                            userTaskmap[assignedUser._id].pendingTasks++;
                        }else if(task.status==="In Progress"){
                            userTaskmap[assignedUser._id].inProgressTasks++;
                        }else if(task.status==="Completed"){
                            userTaskmap[assignedUser._id].completedTasks++;
                        }
                    }
                });
            }
        });
        const workbook =new excelJS.Workbook();
        const worksheet=workbook.addWorksheet("Users Report");
        worksheet.columns=[
            {header:"User Name",key:"name",width:30},
            {header:"Email",key:"email",width:30},
            {header:"Total Tasks",key:"taskCount",width:15},
            {header:"Pending Tasks",key:"pendingTasks",width:15},
            {header:"In Progress Tasks",key:"inProgressTasks",width:15},
            {header:"Completed Tasks",key:"completedTasks",width:15},
        ];
        Object.values(userTaskmap).forEach(user=>{
            worksheet.addRow({
                name:user.name,
                email:user.email,
                taskCount:user.taskCount,
                pendingTasks:user.pendingTasks,
                inProgressTasks:user.inProgressTasks,
                completedTasks:user.completedTasks
            });
        });
        res.setHeader("Content-Type","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition","attachment; filename=users_report.xlsx");
        return workbook.xlsx.write(res).then(()=>{
            res.end();
        });
    }catch(error){
        res.status(500).json({message:"Server error",error:error.message});
    }
}

module.exports={
    exportTasksReport,
    exportUsersReport
}