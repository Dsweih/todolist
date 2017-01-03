$(document).ready(function() {
	
	// 今天日期
	var todayStr = todayDate();

	// 已完成Task數量
	var numDone = 0;
	// 總Task數量
	var numTotal = 0;
	// 初始化資料庫
    var ref = firebaseInit();

    // 重要程度選單click事件
    $(document).on('click', '.jq--task-label', function(event) {
    	// 未完成Task才能開啟選單
    	if($(this).parent().attr('class').indexOf('done') === -1 ) {
        	// 開啟重要程度選單
        	$(this).children('.jq--label-list').stop().slideToggle(400);
        }
    });

    // 選擇重要程度click事件
    $(document).on('click', '.jq--label-list > li', function(event) {
        var $label = $(this).parents('.jq--task-label');
        $label.removeClass(function(index, className) {
            return className = className.replace('task-label jq--task-label', '');
        });
        $label.addClass(event.target.className);

        // 重要程度
        var labelName = event.target.className.replace('label-', '');
        $label.data('label', labelName);

        // Task key
        var key = $(this).parents('.jq--task').attr('id');
        // 更新重要程度
        ref.child(key).update({ label: labelName });
    });

    // 新增按鈕click事件
    $(document).on('click', '.jq--button-add', function(event) {
        // 新增物件
        object = {
            'done': false,
            'label': 'normal',
            'title': '',
            'date': todayStr
        };
        // 新增Task
        var key = addTask(object);
        // 複製範本
        var clone = document.getElementById('template-task').content.cloneNode(true);
        //Task key
        clone.querySelector('.jq--task').id = key;
        // 預設重要程度
        clone.querySelector('.jq--task-label').className += ' label-normal';
        // 輸入框取消唯獨
        clone.querySelector('.jq--task-title').readOnly = false;
        // 隱藏編輯紐
        clone.querySelector('.jq--button-edit').style.display = 'none';
        // 隱藏完成按鈕
        clone.querySelector('.jq--button-done').style.display = 'none';
        var tasks = document.querySelector('.jq--tasks');
        tasks.insertBefore(clone, tasks.firstChild);
        $('.jq--task-title')[0].focus();
        // 總Task數量加一
        $('.jq--total-task').text(++numTotal);
    });

    // 編輯按鈕click事件
    $(document).on('click', '.jq--button-edit', function(event) {
        $(this).siblings('.jq--task-title').removeAttr('readonly').focus();
        $(this).hide();
        $(this).siblings('.jq--button-done').hide();
    });

    // 標記完成按鈕click事件
    $(document).on('click', '.jq--button-done', function(event) {
        var $this = $(this);
        // Task key
        var key = $this.parent().attr('id');
        var object = { "done": true };
        // 標記完成
        markDoneTask(key, object);
        $this.parent().addClass('done');
        $this.siblings('.jq--task-title').attr('readonly', 'readonly');
        $this.hide();
        $this.siblings('.jq--button-edit').hide();

        // 已完成Task數量加一
        $('.jq--done-task').text(++numDone);
    });

    // 刪除按鈕click事件
    $(document).on('click', '.jq--button-delete', function(event) {
    	var task = $(this).parent();
    	var key = task.attr('id');
    	deleteTask(key);
        task.fadeOut('400', function() {
            $(this).remove();
        });
        // 總Task數量減一
        $('.jq--total-task').text(--numTotal);
        // 如為已完成Task則數量減一
        if(task.hasClass('done')) {
        	$('.jq--done-task').text(--numDone);
        }
    });

    // 編輯確認keydown事件
    $(document).on('keydown', '.jq--task-title', function(event) {
        // Enter
        if (event.keyCode === 13) {
            var $this = $(this);
            // Task key
            var key = $this.parent().attr('id');
            var object = { 'title': $this.val() }
                // 更新Task內容
            updateTask(key, object);

            $this.blur().attr('readonly', 'readonly');
            $this.siblings('.jq--button-edit').show();
            $this.siblings('.jq--button-done').show();
        }
    });

    function todayDate() {
		var monthStr = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
			'August', 'September', 'October', 'November', 'December'];
		var dayStr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		var d = new Date();

		var year = d.getFullYear();
		var month = monthStr[d.getMonth()];
		var date = d.getDate();
		var day = dayStr[d.getDay()];

		$('.year').text(year);
		$('.month').text(month);
		$('.date').text(date);
		$('.day').text(day);


		return d.toISOString().substr(0, 10); //yyyy-mm-dd
    }


    // Initialize Firebase
    function firebaseInit() {
	    var config = {
	        apiKey: "AIzaSyA5Lu4Mbd5SiFsaHdHe2hddNgvf4gQfBFI",
	        authDomain: "todolist-9de6f.firebaseapp.com",
	        databaseURL: "https://todolist-9de6f.firebaseio.com",
	        storageBucket: "todolist-9de6f.appspot.com",
	        messagingSenderId: "1075004342530"
	    };
	    firebase.initializeApp(config);

	    // Get a reference to the database service
    	var database = firebase.database();
    	var ref = firebase.database().ref('tasks');

		ref.once('value', function(snapshot) {
	    	numTotal = snapshot.numChildren();
	    	$('.jq--total-task').text(numTotal);
	    	snapshot.forEach(loadTasks);
	    	$('.jq--done-task').text(numDone);
	    });

    	return ref;
    }

    // 載入資料庫資料
    function loadTasks(task) {
        var key = task.key; // task id
        var title = task.val().title; // Task內容
        var label = task.val().label; // 重要程度
        var done = task.val().done; //是否完成

        // 複製範本
        var clone = document.getElementById('template-task').content.cloneNode(true);
        // 給予資料庫之資料
        clone.querySelector('.jq--task').id = key;
        if(done) {
        	 clone.querySelector('.jq--task').className += ' done';
        	 numDone++;
        }
        clone.querySelector('.jq--task-title').value = title;
        clone.querySelector('.jq--task-label').label = label;
        clone.querySelector('.jq--task-label').className += ' label-' + label;
        var tasks = document.querySelector('.jq--tasks');
        tasks.insertBefore(clone, tasks.firstChild);
    }

    // 新增Task
    function addTask(obj) {
        return ref.push(obj).key; // 回傳新增task的id
    }

    // 更新Task
    function updateTask(key, obj) {
        ref.child(key).update(obj);
    }

    // 標記完成Task
    function markDoneTask(key, obj) {
        ref.child(key).update(obj);
    }

    // 刪除Task
    function deleteTask(key) {
        ref.child(key).remove();
    }
});
