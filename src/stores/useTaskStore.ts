import { defineStore } from 'pinia';

interface Task {
    id: number;
    name: string;
    category: string;
    dateAdded: string;
    status: 'Done' | 'Doing' | 'Cancelled';
}

export const useTaskStore = defineStore('taskStore', {
    state: () => ({
        tasks: JSON.parse(localStorage.getItem('tasks') || '[]') as Task[]
    }),

    actions: {
        addTask(task: Task) {
            this.tasks.push(task);
            this.saveTasks();
        },

        updateTaskStatus(id: number, status: 'Done' | 'Doing' | 'Cancelled') {
            const task = this.tasks.find((t) => t.id === id);
            if (task) task.status = status;
            this.saveTasks();
        },

        deleteTask(id: number) {
            this.tasks = this.tasks.filter((t) => t.id !== id);
            this.saveTasks();
        },

        saveTasks() {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        }
    }
});
