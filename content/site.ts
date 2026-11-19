import { currentRole, currentSchool, resume } from "./resume";

// Site configuration. Facts come from resume.ts; this file only adds the
// deployment URL, asset paths, and strings built from resume facts.

const previousRole = resume.experience[1];

export const site = {
  name: resume.name,
  headline: resume.headline,
  // TODO(soham): switch to custom domain when purchased
  url: "https://portfolio-website-soham.vercel.app",
  description: `${resume.name}, ${resume.headline} in ${resume.location}. ${currentRole.title} at ${currentRole.org}, ${previousRole.title} at ${previousRole.org}, ${currentSchool.degree} at ${currentSchool.school}.`,
  profileImage: "/soham-chavan.png",
  // Resume PDF is kept off the public site. Set to "/Soham_Chavan_Resume.pdf"
  // (and add the file to public/) to bring every download link back.
  resumeHref: null as string | null,
};
