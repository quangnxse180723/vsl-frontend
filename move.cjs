const fs = require('fs');
const path = require('path');

const srcDir = path.join('F:', 'sba-project', 'vsl-Frontend', 'vsl-frontend', 'src');

const dirs = ['assets', 'components', 'constants', 'hooks', 'layouts', 'pages', 'services/api', 'types', 'utils', 'config'];
dirs.forEach(d => fs.mkdirSync(path.join(srcDir, d), { recursive: true }));

const moves = [
  ['types.ts', 'types/index.ts'],
  ['data.ts', 'constants/data.ts'],
  ['hook/useSignMentor.ts', 'hooks/useSignMentor.ts'],
  ['components/layout/Header.tsx', 'layouts/Header.tsx'],
  ['components/layout/Sidebar.tsx', 'layouts/Sidebar.tsx'],
  ['components/AdminPortal.tsx', 'pages/AdminPortal.tsx'],
  ['components/AdminView.tsx', 'pages/AdminView.tsx'],
  ['components/AIPracticeView.tsx', 'pages/AIPracticeView.tsx'],
  ['components/DashboardView.tsx', 'pages/DashboardView.tsx'],
  ['components/LessonDetailView.tsx', 'pages/LessonDetailView.tsx'],
  ['components/LessonsView.tsx', 'pages/LessonsView.tsx'],
  ['components/LoginView.tsx', 'pages/LoginView.tsx'],
  ['components/ProfileView.tsx', 'pages/ProfileView.tsx'],
  ['components/RegisterView.tsx', 'pages/RegisterView.tsx']
];

moves.forEach(([from, to]) => {
  const src = path.join(srcDir, from);
  const dest = path.join(srcDir, to);
  if (fs.existsSync(src)) {
    console.log(`Moving ${from} to ${to}`);
    fs.renameSync(src, dest);
  }
});

try { if (fs.existsSync(path.join(srcDir, 'hook'))) fs.rmdirSync(path.join(srcDir, 'hook')); } catch(e){}
try { if (fs.existsSync(path.join(srcDir, 'components', 'layout'))) fs.rmdirSync(path.join(srcDir, 'components', 'layout')); } catch(e){}
