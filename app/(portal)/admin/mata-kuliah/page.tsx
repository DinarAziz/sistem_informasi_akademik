import type { Metadata } from "next";
import { getAdminCourses, getLecturers } from "@/lib/data";
import { requireRole } from "@/lib/auth";
import { SEMESTER_AKTIF } from "@/lib/config";
import { CourseAdmin } from "@/components/course-admin";

export const metadata: Metadata = { title: "Kelola Mata Kuliah" };

export default async function AdminMataKuliahPage() {
  await requireRole("ADMIN");
  const [courses, lecturers] = await Promise.all([getAdminCourses(), getLecturers()]);
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Mata Kuliah</h1>
        <p className="mt-1.5 max-w-prose text-muted">Mata Kuliah yang ditawarkan di semester {SEMESTER_AKTIF}.</p>
      </header>
      <CourseAdmin courses={courses} lecturers={lecturers} />
    </div>
  );
}
