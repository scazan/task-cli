
var fs = require('fs'),
	_ = require('underscore'),
	clc = require('cli-color'),
	taskFile = process.env.HOME + "/tasks.json",
	tasks,
	command = process.argv[2],
	passedData = process.argv[3],
	largestID = 0,
	defaultTask = {
		id: -1,
		open: true,
		name: "",
		sort: 0,
		description: "",
		url: "",
		dueDate: 0,
		scheduledDate: 0,
		dateAdded: 0,
		comments: "",
		subTasks: [],
	};

var init = function init() {
	fs.readFile(taskFile, 'utf8', readTasks);
};

var executeCommands = function executeCommands() {
	if(!command) {
		getTasks();
		return;
	}

	switch( command.toLowerCase() ) {
		case "ls":
			getTasks(passedData);
			break;

		case "add":
		case "a":
			addTask(passedData);
			break;

		case "rm":
			removeTask(passedData);
			break;

		case "x":
		case "close":
			closeTask(passedData);
			break;

		case "edit":
			editTask(passedData);
			break;

		case "move":
			moveTask();
			break;

		default:
			getTasks();
			break;
	}
};

/**
 * Called before exiting the program
 *
 * @return {undefined}
 */
var exit = function exit() {
	writeTasks();
};

/**
 * Parse the tasks from a string and set the global tasks array
 *
 * @param err
 * @param {String} data
 * @return {undefined}
 */
var readTasks = function readTasks(err, data) {
	tasks = JSON.parse(data);

	var sortedTasks = _.sortBy(tasks, function(task) { return parseInt(task.id, 10); });
	largestID = sortedTasks[sortedTasks.length-1].id;

	executeCommands();
	exit();
};

/**
 * Write all tasks to the JSON file
 *
 * @return {undefined}
 */
var writeTasks = function writeTasks() {
	fs.writeFile(taskFile, JSON.stringify(tasks), function(){});
};

/**
 * Get all tasks
 *
 * @return {undefined}
 */
var getTasks = function getTasks(optionString) {
	
	var taskList;

	if(optionString == "a" || optionString == "all") {
		taskList = tasks;

		for(var i=0; i<taskList.length; i++) {
			var task = taskList[i];
			getTask(task);
		}
	}
	else if(parseInt(optionString, 10) > -1) {
		taskList = findTaskByID( parseInt(optionString, 10) );

		if(taskList) {
			process.stdout.write(clc.redBright("\n" + taskList.name + "\n\n") );
			taskList = taskList.subTasks;
		}
		else {
			taskList = [];
		}

		for(var i=0; i<taskList.length; i++) {
			var taskID = taskList[i];
			var task = findTaskByID(taskID);
			task && getTask(task);
		}
	}
	else {
		taskList = _.where(tasks, {open: true, subTask: false});

		for(var i=0; i<taskList.length; i++) {
			var task = taskList[i];
			getTask(task);
		}
	}

};

/**
 * Get a single task
 *
 * @param {object} task
 * @return {undefined}
 */
var getTask = function getTask(task) {
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
		process.stdout.write(clc.blackBright("  [" + task.id + "]" + " - ") + clc.cyan.underline(task.name) );
		task.dueDate && process.stdout.write( clc.redBright("	(" + task.dueDate + ")"));
		subTasksExist && process.stdout.write( clc.cyan(" [+]"));
		process.stdout.write("\n");

		task.description && process.stdout.write(clc.blackBright("	" + task.description) + "\n");
	}
	process.stdout.write("\n");
};

var findTaskByID = function findTaskByID(taskID) {
	var task = _.findWhere(tasks, {id: taskID});

	return task;
};

/**
 * Parse the "key: value" formatted input into an object
 *
 * @param {String} data The input string
 * @return {object} The parsed object
 */
var parseInputData = function parseInputData(data) {
	var params = data.split(","),
		parsedObject = {};

	for(var i=params.length-1; i >=0; i--) {
		var keyValue = params[i].split(":");

		parsedObject[ keyValue[0].split(' ').join('') ] = keyValue[1];
	}

	return parsedObject;

};

/**
 * Add the given task to our array
 *
 * @return {undefined}
 */
var addTask = function addTask(taskData) {
	var subTaskList,
		parsedData,
		subTask = false;

	if(taskData !== undefined) {
		if(parseInt(taskData,10) > -1) {
			subTaskList = findTaskByID(parseInt(taskData,10)).subTasks;

			// If we passed a number instead of data, use the 5th argument and add it as a subtask
			parsedData = parseInputData(process.argv[4]);
			subTask = true;
		}
		else {
			parsedData = parseInputData(taskData);
		}


		var newTask = _.clone(defaultTask)
		_.extend(newTask, parsedData);

		newTask.dateAdded = Date.now();
		newTask.id = largestID + 1;
		newTask.subTask = subTask;

		tasks.unshift( newTask );

		if(subTask) {
			subTaskList.push(newTask.id);
		}

		console.log('Added:');
		getTask(newTask);
	}
	else {
		console.log('no task name given');
	}

};

var editTask = function editTask(taskID) {
	taskID = parseInt( taskID, 10 );
	var params = parseInputData(process.argv[4]);

	var task = findTaskByID(taskID);

	// Concatenate name or description if indicated
	if(params.description && params.description[0] === "+") {
		params.description = task.description + " " + params.description;
	}
	if(params.name && params.name[0] === "+") {
		params.name = task.name + " " + params.name;
	}

	if(task) {
		_.extend(task, params);
		getTask(task);
	}
	else {
		console.log('No task found with that ID');
	}
};

var moveTask = function() {

};

var removeTask = function removeTask(taskID) {
	taskID = parseInt(taskID, 10);
	var task = findTaskByID(taskID);
	var taskIndex = tasks.indexOf(task);

	if(task) {
		tasks.splice(taskIndex, 1);
	}

	console.log('Removing:');
	getTask(task);
};

/**
 * Set a task as "done" or "closed"
 *
 * @return {undefined}
 */
var closeTask = function closeTask(taskID) {
	taskID = parseInt(taskID, 10);
	var task = findTaskByID(taskID);

	if(task) {
		task.open = false;
	}

	console.log('closing:');
	getTask(task);
};

// Start the program
init();
