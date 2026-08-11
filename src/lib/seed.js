/**
 * Starting data for the API.
 *
 * The first time a request reads a collection, `src/lib/db.js` copies these
 * arrays into `data/*.json` at the root of the project. After that, the JSON
 * files are the source of truth and this file is never read again.
 *
 * To reset the API back to this data, delete the `data` folder and make any
 * request. Nothing else is needed.
 */

const CREATED_AT = "2026-01-05T09:00:00.000Z";

export const seedCourses = [
  {
    id: 1,
    code: "WEB101",
    title: "Intro to Web Development",
    instructor: "Jane Doe",
    credits: 3,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 2,
    code: "JS201",
    title: "JavaScript Fundamentals",
    instructor: "Peter Njoroge",
    credits: 4,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 3,
    code: "DB150",
    title: "Databases and SQL",
    instructor: "Grace Wambui",
    credits: 3,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 4,
    code: "UX110",
    title: "User Experience Design",
    instructor: "Fatuma Hassan",
    credits: 2,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 5,
    code: "PY220",
    title: "Python for Data Analysis",
    instructor: "Samuel Kariuki",
    credits: 4,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 6,
    code: "MOB300",
    title: "Mobile App Development",
    instructor: "Achieng Odhiambo",
    credits: 5,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
];

export const seedStudents = [
  {
    id: 1,
    firstName: "Amina",
    lastName: "Otieno",
    email: "amina.otieno@example.com",
    courseIds: [1, 3],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 2,
    firstName: "Brian",
    lastName: "Mwangi",
    email: "brian.mwangi@example.com",
    courseIds: [1, 2, 5],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 3,
    firstName: "Chebet",
    lastName: "Kiprop",
    email: "chebet.kiprop@example.com",
    courseIds: [4],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 4,
    firstName: "David",
    lastName: "Kamau",
    email: "david.kamau@example.com",
    courseIds: [],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 5,
    firstName: "Esther",
    lastName: "Wanjiru",
    email: "esther.wanjiru@example.com",
    courseIds: [2, 6],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 6,
    firstName: "Faith",
    lastName: "Adhiambo",
    email: "faith.adhiambo@example.com",
    courseIds: [1, 4, 6],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 7,
    firstName: "George",
    lastName: "Mutiso",
    email: "george.mutiso@example.com",
    courseIds: [3, 5],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
  {
    id: 8,
    firstName: "Halima",
    lastName: "Yusuf",
    email: "halima.yusuf@example.com",
    courseIds: [2],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  },
];
