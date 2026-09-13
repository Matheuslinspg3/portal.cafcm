import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const pipelinesDeepLink = `    state.selectedPipelineId = target.dataset.openPipeline;
    return renderView();`;
const pipelinesDeepLinkReplace = `    state.selectedPipelineId = target.dataset.openPipeline;
    pushRoute("/esteiras?id=" + state.selectedPipelineId);
    return;`;

const coursesDeepLink = `    state.selectedCourseId = target.dataset.openCourse;
    state.view = "course-editor";
    return renderPortal();`;
const coursesDeepLinkReplace = `    state.selectedCourseId = target.dataset.openCourse;
    state.view = "course-editor";
    pushRoute("/cursos?id=" + state.selectedCourseId);
    return;`;

const studentCoursesDeepLink = `    state.selectedCourseId = target.dataset.openStudentCourse;
    state.view = "student-course";
    return renderPortal();`;
const studentCoursesDeepLinkReplace = `    state.selectedCourseId = target.dataset.openStudentCourse;
    state.view = "student-course";
    pushRoute("/aluno/cursos?id=" + state.selectedCourseId);
    return;`;

content = content.replace(pipelinesDeepLink, pipelinesDeepLinkReplace);
content = content.replace(coursesDeepLink, coursesDeepLinkReplace);
content = content.replace(studentCoursesDeepLink, studentCoursesDeepLinkReplace);

fs.writeFileSync('src/app.js', content);
