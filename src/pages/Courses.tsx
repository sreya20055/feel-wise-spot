import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Clock, CheckCircle, Play, Search, ExternalLink, Star, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { externalCoursesService, type ExternalCourse, type CourseSearchFilters } from '@/services/externalCoursesService';
import { useState } from 'react';

export default function Courses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchFilters, setSearchFilters] = useState<CourseSearchFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('internal');

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('micro_courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: userProgress } = useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: externalCourses, isLoading: isLoadingExternal } = useQuery({
    queryKey: ['external-courses', searchFilters],
    queryFn: () => externalCoursesService.searchCourses({
      ...searchFilters,
      search: searchTerm || undefined
    }),
    enabled: activeTab === 'external',
  });

  const getProgressForCourse = (courseId: string) => {
    return userProgress?.find(p => p.course_id === courseId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'udemy':
        return 'bg-purple-100 text-purple-800';
      case 'coursera':
        return 'bg-blue-100 text-blue-800';
      case 'edx':
        return 'bg-indigo-100 text-indigo-800';
      case 'khan_academy':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSearch = () => {
    setSearchFilters({ ...searchFilters, search: searchTerm });
  };

  const handleFilterChange = (key: keyof CourseSearchFilters, value: string) => {
    setSearchFilters({ ...searchFilters, [key]: value === 'all' ? undefined : value });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="font-semibold">Learning Resources</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Learning Resources</h1>
          <p className="text-muted-foreground">
            Discover courses and educational content to build your mental health toolkit
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="internal">Platform Courses</TabsTrigger>
            <TabsTrigger value="external">Discover More</TabsTrigger>
          </TabsList>

          <TabsContent value="internal" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course) => {
                const progress = getProgressForCourse(course.id);
                const isCompleted = progress?.completed;
                
                return (
                  <Card key={course.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getDifficultyColor(course.difficulty_level)}>
                          {course.difficulty_level}
                        </Badge>
                        {isCompleted && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration_minutes} minutes</span>
                        </div>
                        
                        {course.tags && course.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {course.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => navigate(`/course/${course.id}`)}
                        className="w-full gap-2"
                        variant={isCompleted ? "outline" : "default"}
                      >
                        {isCompleted ? (
                          <>
                            <BookOpen className="h-4 w-4" />
                            Review Course
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Start Course
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!courses?.length && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No platform courses available</h3>
                <p className="text-muted-foreground">
                  Internal courses will appear here once they're published.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="external" className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="space-y-4 p-4 bg-card rounded-lg border">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Select onValueChange={(value) => handleFilterChange('difficulty', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => handleFilterChange('price', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="free">Free Only</SelectItem>
                    <SelectItem value="paid">Paid Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Mental Health">Mental Health</SelectItem>
                    <SelectItem value="Psychology">Psychology</SelectItem>
                    <SelectItem value="Personal Development">Personal Development</SelectItem>
                    <SelectItem value="Health & Wellness">Health & Wellness</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => handleFilterChange('provider', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    <SelectItem value="udemy">Udemy</SelectItem>
                    <SelectItem value="coursera">Coursera</SelectItem>
                    <SelectItem value="edx">edX</SelectItem>
                    <SelectItem value="khan_academy">Khan Academy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* External Courses Grid */}
            {isLoadingExternal ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Searching for courses...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {externalCourses?.map((course) => (
                  <Card key={course.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={getDifficultyColor(course.difficulty_level)}>
                            {course.difficulty_level}
                          </Badge>
                          <Badge className={getProviderColor(course.provider)} variant="outline">
                            {course.provider}
                          </Badge>
                        </div>
                        {course.is_free && (
                          <Badge variant="secondary">FREE</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        {course.description}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-2">by {course.instructor}</p>
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration_minutes} minutes</span>
                          </div>
                          {course.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{course.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        
                        {course.students_count && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{course.students_count.toLocaleString()} students</span>
                          </div>
                        )}
                        
                        {course.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {course.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {!course.is_free && course.price && (
                          <p className="font-semibold text-lg">${course.price}</p>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => window.open(course.url, '_blank')}
                        className="w-full gap-2"
                        variant="outline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Course
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoadingExternal && externalCourses?.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or check back later.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}