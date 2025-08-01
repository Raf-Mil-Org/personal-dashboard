import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                {
                    path: '/financial-dashboard',
                    name: 'financial-dashboard',
                    component: () => import('@/views/ExpensesDashboard.vue')
                },
                {
                    path: '/demo-functionalities',
                    name: 'demo-functionalities',
                    component: () => import('@/views/DemoFunctionalities.vue')
                },
                {
                    path: '/chat-gpt',
                    name: 'chat-gpt',
                    component: () => import('@/views/ChatGPT.vue')
                },
                {
                    path: '/financial-dashboard-2',
                    name: 'financial-dashboard-2',
                    component: () => import('@/views/FinancialDashboard2.vue')
                },
                {
                    path: '/financial-dashboard-3',
                    name: 'financial-dashboard-3',
                    component: () => import('@/views/FinancialDashboard3.vue')
                },
                {
                    path: '/stocks-table',
                    name: 'stocks-table',
                    component: () => import('@/views/StocksTable.vue')
                },
                {
                    path: '/visuals-dashboard',
                    name: 'visuals-dashboard',
                    component: () => import('@/views/VisualsDashboard.vue')
                },
                {
                    path: '/journal-dashboard',
                    name: 'journal-dashboard',
                    component: () => import('@/views/JournalDashboard.vue')
                },
                // {
                //     path: '/thoughts',
                //     name: 'thoughts',
                //     component: () => import('@/views/Thoughts.vue')
                // },
                {
                    path: '/thought-tracker',
                    name: 'thought-tracker',
                    component: () => import('@/views/ThoughtTracker.vue')
                },
                {
                    path: '/photo-uploader',
                    name: 'photo-uploader',
                    component: () => import('@/views/PhotoUploader.vue')
                },
                {
                    path: '/health-dashboard',
                    name: 'health-dashboard',
                    component: () => import('@/views/HealthDashboard.vue')
                },
                // {
                //     path: '/customers-overview',
                //     name: 'customers-overview',
                //     component: () => import('@/views/CustomersOverview.vue')
                // },
                {
                    path: '/task-planner',
                    name: 'task-planner',
                    component: () => import('@/views/TaskPlanner.vue')
                },
                {
                    path: '/task-planner-2',
                    name: 'task-planner-2',
                    component: () => import('@/views/TaskPlanner2.vue')
                },
                {
                    path: '/financial-dashboard-claude',
                    name: 'financial-dashboard-claude',
                    component: () => import('@/views/ExpensesDashboardClaude.vue')
                },
                {
                    path: '/uikit/formlayout',
                    name: 'formlayout',
                    component: () => import('@/views/uikit/FormLayout.vue')
                },
                {
                    path: '/uikit/input',
                    name: 'input',
                    component: () => import('@/views/uikit/InputDoc.vue')
                },
                {
                    path: '/uikit/button',
                    name: 'button',
                    component: () => import('@/views/uikit/ButtonDoc.vue')
                },
                {
                    path: '/uikit/table',
                    name: 'table',
                    component: () => import('@/views/uikit/TableDoc.vue')
                },
                {
                    path: '/uikit/list',
                    name: 'list',
                    component: () => import('@/views/uikit/ListDoc.vue')
                },
                {
                    path: '/uikit/tree',
                    name: 'tree',
                    component: () => import('@/views/uikit/TreeDoc.vue')
                },
                {
                    path: '/uikit/panel',
                    name: 'panel',
                    component: () => import('@/views/uikit/PanelsDoc.vue')
                },

                {
                    path: '/uikit/overlay',
                    name: 'overlay',
                    component: () => import('@/views/uikit/OverlayDoc.vue')
                },
                {
                    path: '/uikit/media',
                    name: 'media',
                    component: () => import('@/views/uikit/MediaDoc.vue')
                },
                {
                    path: '/uikit/message',
                    name: 'message',
                    component: () => import('@/views/uikit/MessagesDoc.vue')
                },
                {
                    path: '/uikit/file',
                    name: 'file',
                    component: () => import('@/views/uikit/FileDoc.vue')
                },
                {
                    path: '/uikit/menu',
                    name: 'menu',
                    component: () => import('@/views/uikit/MenuDoc.vue')
                },
                {
                    path: '/uikit/charts',
                    name: 'charts',
                    component: () => import('@/views/uikit/ChartDoc.vue')
                },
                {
                    path: '/uikit/misc',
                    name: 'misc',
                    component: () => import('@/views/uikit/MiscDoc.vue')
                },
                {
                    path: '/uikit/timeline',
                    name: 'timeline',
                    component: () => import('@/views/uikit/TimelineDoc.vue')
                },
                {
                    path: '/pages/empty',
                    name: 'empty',
                    component: () => import('@/views/pages/Empty.vue')
                },
                {
                    path: '/pages/crud',
                    name: 'crud',
                    component: () => import('@/views/pages/Crud.vue')
                },
                {
                    path: '/documentation',
                    name: 'documentation',
                    component: () => import('@/views/pages/Documentation.vue')
                }
            ]
        },
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },

        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        }
    ]
});

export default router;
