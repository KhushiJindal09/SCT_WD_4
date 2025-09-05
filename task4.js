 // Data structures
    let tasks = [];
    let lists = [{ id: 'primary', name: 'Primary Tasks' }];
    let editingTaskId = null;

    // DOM elements
    const listsContainer = document.getElementById('lists-container');
    const createListBtn = document.getElementById('create-list-btn');
    const globalSearchInput = document.getElementById('global-search');
    const globalSortSelect = document.getElementById('global-sort');
    const exportBtn = document.getElementById('export-btn');

    const editModal = document.getElementById('edit-modal');
    const editTitleInput = document.getElementById('edit-title');
    const editDeadlineInput = document.getElementById('edit-deadline');
    const editPrioritySelect = document.getElementById('edit-priority');
    const saveEditBtn = document.getElementById('save-edit');
    const cancelEditBtn = document.getElementById('cancel-edit');

    // Confirmation modal elements
    const confirmModal = document.getElementById('confirm-modal');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmYesBtn = document.getElementById('confirm-yes');
    const confirmNoBtn = document.getElementById('confirm-no');

    // Generate unique ID
    function generateUniqueId() {
      return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Show confirmation modal and return a Promise that resolves to true/false
    function showConfirm(message) {
      confirmMessage.textContent = message;
      confirmModal.classList.add('show');

      return new Promise((resolve) => {
        function onYes() {
          cleanup();
          resolve(true);
        }
        function onNo() {
          cleanup();
          resolve(false);
        }
        function cleanup() {
          confirmModal.classList.remove('show');
          confirmYesBtn.removeEventListener('click', onYes);
          confirmNoBtn.removeEventListener('click', onNo);
        }
        confirmYesBtn.addEventListener('click', onYes);
        confirmNoBtn.addEventListener('click', onNo);
      });
    }

    // Filter and sort tasks globally
    function getFilteredSortedTasks() {
      let filteredTasks = [...tasks];

      // Search filter
      const searchTerm = globalSearchInput.value.trim().toLowerCase();
      if (searchTerm) {
        filteredTasks = filteredTasks.filter(task => task.title.toLowerCase().includes(searchTerm));
      }

      // Sort
      const sortBy = globalSortSelect.value;
      filteredTasks.sort((a, b) => {
        switch (sortBy) {
          case 'title-asc':
            return a.title.localeCompare(b.title);
          case 'title-desc':
            return b.title.localeCompare(a.title);
          case 'priority-asc':
            return priorityValue(a.priority) - priorityValue(b.priority);
          case 'priority-desc':
            return priorityValue(b.priority) - priorityValue(a.priority);
          case 'deadline-asc':
            return (a.deadline || '') > (b.deadline || '') ? 1 : (a.deadline || '') < (b.deadline || '') ? -1 : 0;
          case 'deadline-desc':
            return (a.deadline || '') < (b.deadline || '') ? 1 : (a.deadline || '') > (b.deadline || '') ? -1 : 0;
          case 'completed':
            return (b.completed === true) - (a.completed === true);
          case 'incomplete':
            return (a.completed === true) - (b.completed === true);
          default:
            return 0;
        }
      });

      return filteredTasks;
    }

    function priorityValue(priority) {
      switch(priority) {
        case 'low': return 1;
        case 'medium': return 2;
        case 'high': return 3;
        default: return 0;
      }
    }

    // Render all lists and their tasks with filtering and sorting applied
    function renderLists() {
      listsContainer.innerHTML = '';
      const filteredSortedTasks = getFilteredSortedTasks();

      lists.forEach(list => {
        const listDiv = document.createElement('div');
        listDiv.className = 'list-banner';
        listDiv.dataset.listId = list.id;

        // Filter tasks for this list after global filtering/sorting
        const listTasks = filteredSortedTasks.filter(task => task.list === list.id);

        listDiv.innerHTML = `
          <div class="list-content p-6 rounded-2xl relative z-10">
            <h2 class="text-3xl font-bold text-white mb-4 flex justify-between items-center">
              <span>${list.name}</span>
              <button class="delete-list-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1" title="Delete List">
                <i class="fas fa-trash"></i> Delete
              </button>
            </h2>
            <div class="mb-4 flex gap-2">
              <input type="text" placeholder="Add new task..." class="new-task-input flex-grow p-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-blue-200 border border-white border-opacity-30 focus:bg-opacity-30" />
              <input type="datetime-local" class="new-task-deadline p-3 rounded-lg bg-white bg-opacity-20 text-white placeholder-blue-200 border border-white border-opacity-30 focus:bg-opacity-30" />
              <select class="new-task-priority p-3 rounded-lg bg-white bg-opacity-20 text-white border border-white border-opacity-30 focus:bg-opacity-30">
                <option value="low" class="text-gray-800">Low</option>
                <option value="medium" class="text-gray-800" selected>Medium</option>
                <option value="high" class="text-gray-800">High</option>
              </select>
              <button class="add-task-btn bg-gradient-to-r from-green-400 to-blue-500 hover:from-pink-500 hover:to-yellow-500 text-white font-bold px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105" title="Add Task">
                <i class="fas fa-plus-circle"></i>
              </button>
            </div>
            <div id="${list.id}-task-list" class="space-y-4"></div>
            <div class="text-white text-opacity-70 mt-4">Total tasks: <span id="${list.id}-count" class="font-semibold">${listTasks.length}</span></div>
          </div>
        `;
        listsContainer.appendChild(listDiv);

        // Add event listeners for add task button in this list
        const addTaskBtn = listDiv.querySelector('.add-task-btn');
        const newTaskInput = listDiv.querySelector('.new-task-input');
        const newTaskDeadline = listDiv.querySelector('.new-task-deadline');
        const newTaskPriority = listDiv.querySelector('.new-task-priority');

        addTaskBtn.addEventListener('click', () => {
          const title = newTaskInput.value.trim();
          if (!title) {
            alert('Please enter a task title.');
            return;
          }
          const deadline = newTaskDeadline.value || null;
          const priority = newTaskPriority.value;

          tasks.push({
            id: generateUniqueId(),
            title,
            deadline,
            priority,
            completed: false,
            list: list.id,
          });

          newTaskInput.value = '';
          newTaskDeadline.value = '';
          newTaskPriority.value = 'medium';

          renderLists();
        });

        // Delete list button
        const deleteListBtn = listDiv.querySelector('.delete-list-btn');
        deleteListBtn.addEventListener('click', async () => {
          const confirmed = await showConfirm(`Are you sure you want to delete the list "${list.name}" and all its tasks?`);
          if (confirmed) {
            // Remove tasks in this list
            tasks = tasks.filter(t => t.list !== list.id);
            // Remove list
            lists = lists.filter(l => l.id !== list.id);
            renderLists();
          }
        });

        // Render tasks for this list
        const taskListEl = listDiv.querySelector(`#${list.id}-task-list`);
        taskListEl.innerHTML = '';

        listTasks.forEach(task => {
          const taskCard = document.createElement('div');
          taskCard.className = 'task-card p-5';
          if (task.completed) taskCard.classList.add('completed-task');
          taskCard.dataset.taskId = task.id;

          let deadlineText = '';
          if (task.deadline) {
            const deadline = new Date(task.deadline);
            deadlineText = `<i class="fas fa-clock mr-2"></i>${deadline.toLocaleString()}`;
            if (new Date() > deadline && !task.completed) {
              deadlineText = `<span class="text-red-300"><i class="fas fa-exclamation-triangle mr-2"></i>OVERDUE: ${deadline.toLocaleString()}</span>`;
            }
          }

          let priorityColor = '';
          switch (task.priority) {
            case 'low': priorityColor = 'text-green-300'; break;
            case 'medium': priorityColor = 'text-yellow-300'; break;
            case 'high': priorityColor = 'text-red-300'; break;
          }

          taskCard.innerHTML = `
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-4">
                <input type="checkbox" class="w-6 h-6 text-green-500 rounded-full focus:ring-green-400 border-white" ${task.completed ? 'checked' : ''} />
                <h3 class="text-xl font-semibold text-white ${task.completed ? 'line-through opacity-60' : ''}">${task.title}</h3>
              </div>
              <span class="text-sm ${priorityColor} font-medium">${task.priority.toUpperCase()}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-blue-200">${deadlineText}</span>
              <div class="space-x-3">
                <button class="edit-btn bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg transition duration-300"><i class="fas fa-edit mr-1"></i>Edit</button>
                <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-300"><i class="fas fa-trash mr-1"></i>Delete</button>
              </div>
            </div>
          `;

          taskListEl.appendChild(taskCard);

          // Event listeners
          const checkbox = taskCard.querySelector('input[type="checkbox"]');
          checkbox.addEventListener('change', () => {
            task.completed = checkbox.checked;
            renderLists();
          });

          taskCard.querySelector('.edit-btn').addEventListener('click', () => openEditModal(task));
          taskCard.querySelector('.delete-btn').addEventListener('click', async () => {
            const confirmed = await showConfirm('Are you sure you want to delete this task?');
            if (confirmed) {
              deleteTask(task.id);
            }
          });
        });

      });

      renderTasks();
    }

    // Render tasks (called inside renderLists)
    function renderTasks() {
      // Already handled in renderLists loop
    }

    // Open edit modal
    function openEditModal(task) {
      editingTaskId = task.id;
      editTitleInput.value = task.title;
      editDeadlineInput.value = task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '';
      editPrioritySelect.value = task.priority;
      editModal.classList.remove('hidden');
    }

    // Save edit
    saveEditBtn.addEventListener('click', () => {
      const task = tasks.find(t => t.id === editingTaskId);
      if (!task) return;

      const newTitle = editTitleInput.value.trim();
      if (!newTitle) {
        alert('Task title cannot be empty.');
        return;
      }
      task.title = newTitle;
      task.deadline = editDeadlineInput.value || null;
      task.priority = editPrioritySelect.value;

      editModal.classList.add('hidden');
      renderLists();
    });

    // Cancel edit
    cancelEditBtn.addEventListener('click', () => {
      editModal.classList.add('hidden');
    });

    // Delete task
    function deleteTask(id) {
      tasks = tasks.filter(t => t.id !== id);
      renderLists();
    }

    // Export tasks as JSON
    exportBtn.addEventListener('click', () => {
      const dataStr = JSON.stringify(tasks, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

      const exportFileDefaultName = 'todo-tasks.json';

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    });

    // Search and sort listeners
    globalSearchInput.addEventListener('input', renderLists);
    globalSortSelect.addEventListener('change', renderLists);

    // Create new list
    createListBtn.addEventListener('click', () => {
      const listName = prompt('Enter new list name:');
      if (!listName || !listName.trim()) return;
      const id = listName.trim().toLowerCase().replace(/\s+/g, '-');
      if (lists.find(l => l.id === id)) {
        alert('List with this name already exists.');
        return;
      }
      lists.push({ id, name: listName.trim() });
      renderLists();
    });

    // Initial render
    renderLists();