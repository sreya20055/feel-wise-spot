import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  ThumbsUp,
  Award,
  Search,
  Plus,
  Heart,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Reply
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  communityService, 
  ForumPost, 
  ForumReply, 
  UserProfile,
  PeerGroup
} from '@/services/communityService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'forum' | 'groups'>('forum');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [showNewGroupDialog, setShowNewGroupDialog] = useState(false);
  
  // New post form
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('');
  const [newPostTags, setNewPostTags] = useState('');

  // New group form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<'study' | 'relaxation' | 'support' | 'creative'>('study');
  const [newGroupMaxParticipants, setNewGroupMaxParticipants] = useState(6);

  // Get categories
  const { data: categories } = useQuery({
    queryKey: ['community-categories'],
    queryFn: () => communityService.getCategories(),
  });

  // Get forum posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['forum-posts', selectedCategory, searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        return communityService.searchPosts(searchQuery, selectedCategory || undefined);
      }
      return communityService.getPosts(selectedCategory || undefined);
    },
  });

  // Get peer groups
  const { data: peerGroups } = useQuery({
    queryKey: ['peer-groups'],
    queryFn: () => communityService.getRecommendedPeerGroups(user?.id || ''),
    enabled: !!user,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!user || !newPostTitle.trim() || !newPostContent.trim() || !newPostCategory) {
        throw new Error('Please fill in all required fields');
      }

      const tags = newPostTags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      return communityService.createPost(
        user.id,
        newPostTitle,
        newPostContent,
        newPostCategory,
        tags
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-posts'] });
      setShowNewPostDialog(false);
      resetNewPostForm();
      toast({
        title: "Post created!",
        description: "Your post has been shared with the community.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async () => {
      if (!user || !newGroupName.trim() || !newGroupDescription.trim()) {
        throw new Error('Please fill in all required fields');
      }

      return communityService.createPeerGroup(
        user.id,
        newGroupName,
        newGroupDescription,
        newGroupCategory,
        newGroupMaxParticipants
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peer-groups'] });
      setShowNewGroupDialog(false);
      resetNewGroupForm();
      toast({
        title: "Group created!",
        description: "Your peer group is now available for others to join.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetNewPostForm = () => {
    setNewPostTitle('');
    setNewPostContent('');
    setNewPostCategory('');
    setNewPostTags('');
  };

  const resetNewGroupForm = () => {
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupCategory('study');
    setNewGroupMaxParticipants(6);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'emotional-health': return <Heart className="h-4 w-4" />;
      case 'neurodivergent-life': return <Users className="h-4 w-4" />;
      case 'study-productivity': return <Calendar className="h-4 w-4" />;
      case 'coping-strategies': return <Shield className="h-4 w-4" />;
      case 'career-support': return <Award className="h-4 w-4" />;
      case 'accessibility': return <CheckCircle className="h-4 w-4" />;
      case 'celebrations': return <Award className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getGroupCategoryColor = (category: string) => {
    switch (category) {
      case 'study': return 'bg-blue-100 text-blue-800';
      case 'relaxation': return 'bg-green-100 text-green-800';
      case 'support': return 'bg-purple-100 text-purple-800';
      case 'creative': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Please sign in to access the community</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold">Community</h1>
              <p className="text-sm text-muted-foreground">Connect with peers in a safe, supportive space</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Safety Notice */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Community Guidelines</h3>
                <p className="text-blue-800 text-sm">
                  This is a safe, moderated space for peer support. Be kind, respectful, and supportive. 
                  All posts are reviewed by AI moderation for safety. If you are in crisis, please contact 
                  <strong> 988 (Suicide & Crisis Lifeline)</strong> immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'forum' | 'groups')}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="forum" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Forum
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2">
                <Users className="h-4 w-4" />
                Peer Groups
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {activeTab === 'forum' && (
                <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Post</DialogTitle>
                      <DialogDescription>
                        Share your thoughts, questions, or experiences with the community.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Category</label>
                        <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  {getCategoryIcon(category.id)}
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Title</label>
                        <Input
                          value={newPostTitle}
                          onChange={(e) => setNewPostTitle(e.target.value)}
                          placeholder="What would you like to discuss?"
                          maxLength={100}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Content</label>
                        <Textarea
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                          placeholder="Share your thoughts, experiences, or questions..."
                          className="min-h-[120px]"
                          maxLength={2000}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Tags (optional)</label>
                        <Input
                          value={newPostTags}
                          onChange={(e) => setNewPostTags(e.target.value)}
                          placeholder="anxiety, tips, support (comma-separated)"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => createPostMutation.mutate()}
                          disabled={createPostMutation.isPending}
                          className="flex-1"
                        >
                          {createPostMutation.isPending ? 'Posting...' : 'Post to Community'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowNewPostDialog(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {activeTab === 'groups' && (
                <Dialog open={showNewGroupDialog} onOpenChange={setShowNewGroupDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Peer Group</DialogTitle>
                      <DialogDescription>
                        Start a peer group for study sessions, relaxation, or support.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Group Name</label>
                        <Input
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="e.g., Study Buddies, Mindful Monday"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Description</label>
                        <Textarea
                          value={newGroupDescription}
                          onChange={(e) => setNewGroupDescription(e.target.value)}
                          placeholder="Describe what your group will do together..."
                          className="min-h-[80px]"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Category</label>
                        <Select value={newGroupCategory} onValueChange={(value: any) => setNewGroupCategory(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="study">Study & Productivity</SelectItem>
                            <SelectItem value="relaxation">Relaxation & Mindfulness</SelectItem>
                            <SelectItem value="support">Peer Support</SelectItem>
                            <SelectItem value="creative">Creative Activities</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Max Participants: {newGroupMaxParticipants}
                        </label>
                        <Input
                          type="range"
                          min="3"
                          max="12"
                          value={newGroupMaxParticipants}
                          onChange={(e) => setNewGroupMaxParticipants(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => createGroupMutation.mutate()}
                          disabled={createGroupMutation.isPending}
                          className="flex-1"
                        >
                          {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowNewGroupDialog(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <TabsContent value="forum" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Forum Posts */}
            <div className="space-y-4">
              <AnimatePresence>
                {postsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-4">Loading posts...</p>
                  </div>
                ) : posts?.length ? (
                  posts.map((post) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {post.anonymous_name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{post.anonymous_name}</p>
                                <p className="text-xs text-muted-foreground">{formatTimeAgo(post.created_at)}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="gap-1">
                              {getCategoryIcon(post.category)}
                              {categories?.find(c => c.id === post.category)?.name}
                            </Badge>
                          </div>

                          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                          <p className="text-muted-foreground mb-4 line-clamp-3">{post.content}</p>

                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              {post.upvotes}
                            </div>
                            <div className="flex items-center gap-1">
                              <Reply className="h-4 w-4" />
                              {post.replies_count} replies
                            </div>
                            {post.moderation_flags && post.moderation_flags.length > 0 && (
                              <Badge variant="outline" className="text-xs gap-1">
                                <Shield className="h-3 w-3" />
                                Moderated
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No posts found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || selectedCategory 
                        ? "Try adjusting your search or filters" 
                        : "Be the first to start a conversation!"
                      }
                    </p>
                    <Button onClick={() => setShowNewPostDialog(true)}>
                      Create First Post
                    </Button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {peerGroups?.map((group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <Badge className={`mt-2 ${getGroupCategoryColor(group.category)}`}>
                          {group.category}
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {group.current_participants}/{group.max_participants}
                        <Users className="h-4 w-4 inline ml-1" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">{group.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {formatTimeAgo(group.created_at)}
                      </div>
                      <Button size="sm" variant="outline">
                        Join Group
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) ?? (
                <div className="col-span-full text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No peer groups yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create the first peer group and bring people together!
                  </p>
                  <Button onClick={() => setShowNewGroupDialog(true)}>
                    Create First Group
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}