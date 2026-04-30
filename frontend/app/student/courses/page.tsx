"use client";

import { useState, useEffect } from "react";
import { BookOpen, PlayCircle, Clock } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/student/dashboard").then(r => {
      if (r.data?.enrolledCourses) setCourses(r.data.enrolledCourses);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-400 text-sm">Loading your courses...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">My Learning</h1>
      
      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-soft">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-brand-navy mb-2">No courses yet</h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">You aren't enrolled in any courses right now. Check out our catalog to get started!</p>
          <Link href="/courses" className="px-6 py-2.5 bg-brand-gold text-white rounded-xl font-bold hover:bg-amber-600 transition-colors inline-block">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course._id} className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden group hover:shadow-md transition-shadow flex flex-col">
              <div className="aspect-video bg-gradient-to-br from-brand-navy to-indigo-900 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-white/50 group-hover:text-white transition-colors" />
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs font-bold text-brand-gold uppercase tracking-wider mb-2">{course.instructor}</div>
                <h3 className="font-bold text-brand-navy text-lg leading-tight mb-2 flex-1">{course.title}</h3>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-5">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {course.duration || "Self-paced"}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-brand-navy">{course.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-navy rounded-full" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
                
                <Link href={`/student/courses/${course._id}`} className="mt-5 block w-full py-2.5 bg-brand-navy/5 text-brand-navy text-center rounded-xl text-sm font-semibold hover:bg-brand-navy hover:text-white transition-colors">
                  Continue Learning
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
