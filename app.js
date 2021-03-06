
var fs = require('fs'),
	_ = require('underscore'),
	clc = require('cli-color'),
	taskEngine = require('taskengine')(),
	command = process.argv[2],
	passedData = process.argv[3];

var init = function init() {

	taskEngine.init(function() {
		executeCommands();
		exit();
	});
};

var executeCommands = function executeCommands() {
	// Print out the current date for reference
	var currentDate = new Date();
	process.stdout.write(clc.greenBright("\n" + currentDate.toDateString() + "\n\n") );

	if(!command) {
		listAllTasks(passedData);
		return;
	}


	switch( command.toLowerCase() ) {
		case "ls":
			listAllTasks(passedData);
			break;

		case "add":
		case "a":
			// Create an array of passed arguments
			var inputData = [],
				inputArgs = process.argv,
				argumentIndex = 3; // The index of the first argument containing "data"

			// If that first argument is an integer, then we are using it to indicate a subtask. Set the index +1 since that is where the data actually is
			if(parseInt(process.argv[3], 10) >= 0 ) {
				argumentIndex = 4;
			}

			// Convert the arguments array into a real array. Only collect the arguments past (and including) the argumentIndex
			for(var i=argumentIndex; i<=inputArgs.length-1; i++) {
				inputData.push(inputArgs[i]);
			}

			inputData = inputData.join(" ");

			// If we have a subtask pass the data as a subtask and the first piece of data as the task to add it to
			if(argumentIndex > 3) {
				var addedTask = taskEngine.addTask(passedData, inputData);
			}
			// otherwise, simply pass the input data
			else {
				var addedTask = taskEngine.addTask(inputData);
			}

			displayTask(addedTask);

			break;

		case "rm":
			displayTask( taskEngine.removeTask(passedData) );
			break;

		case "x":
		case "close":
			displayTask( taskEngine.closeTask(passedData) );
			break;

		case "edit":
			var editedTask = taskEngine.editTask(passedData, process.argv[4]);

			if(editedTask) {
				displayTask( editedTask );
			}
			else {
				console.log('No task found with that ID');
			}
			break;

		case "move":
			taskEngine.moveTask();
			break;

		default:
			listAllTasks(passedData);
			break;
	}
};

var listAllTasks = function listAllTasks(passedArgs) {
	var options = {collection: taskEngine.tasks};

	if(passedArgs == "a" || passedArgs == "all") {
		options.all = true;
	}
	else if(parseInt(passedArgs, 10) > -1) {
		options.taskID = parseInt(passedArgs, 10);
	}

	displayTasks(options);
};

/**
 * Called before exiting the program
 *
 * @return {undefined}
 */
var exit = function exit() {
	taskEngine.close();
};


/**
 * Display all tasks
 *
 * @return {undefined}
 */
var displayTasks = function displayTasks(options) {
	
	var taskList,
		returnAll = options.all,
		taskID = options.taskID,
		tasksCollection = options.collection;

	if(returnAll) {
		taskList = tasksCollection;

		for(var i=0; i<taskList.length; i++) {
			var task = taskList[i];
			displayTask(task);
		}
	}
	else if(taskID !== undefined) {
		taskList = taskEngine.getTaskByID( taskID );

		if(taskList) {
			process.stdout.write(clc.redBright("\n" + "[" + taskList.id + "] - " +taskList.name + "\n\n") );
			taskList = taskList.subTasks;
		}
		else {
			taskList = [];
		}

		for(var i=0; i<taskList.length; i++) {
			var taskID = taskList[i];
			var task = taskEngine.getTaskByID(taskID);
			task && displayTask(task);
		}
	}
	else {
		taskList = _.where(tasksCollection, {open: true, subTask: false});

		for(var i=0; i<taskList.length; i++) {
			var task = taskList[i];
			displayTask(task);
		}
	}

};

/**
 * Get a single task
 *
 * @param {object} task
 * @return {undefined}
 */
var displayTask = function displayTask(task) {
	var openClosed = "",
		subTasksExist = false;

	if(task.subTasks.length > 0) {
		subTasksExist = true;
	}

	// if the task is closed, don't print details
	if(!task.open) {
		openClosed = "×";
		console.log(clc.blackBright.strike(openClosed + "  " + task.id + " - " + task.name));
	}
	else {
		process.stdout.write(clc.white("  [" + task.id + "]" + " - ") + clc.cyan.underline(task.name) );
		task.dueDate && process.stdout.write( clc.redBright("	(" + task.dueDate + ")"));
		subTasksExist && process.stdout.write( clc.cyan(" [+]"));
		process.stdout.write("\n");

		task.description && process.stdout.write(clc.blackBright("	" + task.description) + "\n");
		task.url && process.stdout.write(clc.blackBright("	" + task.url) + "\n");
	}
	process.stdout.write("\n");
};

// Start the program
init();
