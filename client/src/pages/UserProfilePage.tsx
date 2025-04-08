import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Film,
  Tv,
  Bookmark,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface UserStats {
  watchlistCount: number;
  watchedMovies: number;
  watchedEpisodes: number;
  totalWatched: number;
}

interface UserProfileData {
  user: {
    id: number;
    username: string;
    email: string;
    isAdmin: boolean;
  };
  stats: UserStats;
  recentlyWatched: Array<{
    id: number;
    mediaType: string;
    mediaId: number;
    episodeId?: number;
    watchedAt: string;
    progress: number;
    content?: any;
    episode?: any;
  }>;
}

export default function UserProfilePage() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: profileData, isLoading } = useQuery<UserProfileData>({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
  });
  
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);
  
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => setLocation("/")} 
          className="flex items-center text-primary mr-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span>Back to Home</span>
        </button>
        <h1 className="text-3xl font-bold">Your Profile</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User info card */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UserIcon className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">{user.username}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {user.isAdmin && (
                  <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Admin
                  </span>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-medium">{user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-medium">{user.isAdmin ? "Admin" : "User"}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <button 
                onClick={handleLogout}
                className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 py-2 rounded-md"
              >
                Sign Out
              </button>
            </CardFooter>
          </Card>
          
          {/* Stats card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Your Stats</CardTitle>
              <CardDescription>Your streaming activity</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-primary/5">
                    <Film className="h-6 w-6 text-primary mb-1" />
                    <span className="text-2xl font-bold">{profileData?.stats.watchedMovies || 0}</span>
                    <span className="text-xs text-muted-foreground">Movies Watched</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 rounded-lg bg-primary/5">
                    <Tv className="h-6 w-6 text-primary mb-1" />
                    <span className="text-2xl font-bold">{profileData?.stats.watchedEpisodes || 0}</span>
                    <span className="text-xs text-muted-foreground">Episodes Watched</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 rounded-lg bg-primary/5">
                    <Bookmark className="h-6 w-6 text-primary mb-1" />
                    <span className="text-2xl font-bold">{profileData?.stats.watchlistCount || 0}</span>
                    <span className="text-xs text-muted-foreground">Watchlist Items</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 rounded-lg bg-primary/5">
                    <Clock className="h-6 w-6 text-primary mb-1" />
                    <span className="text-2xl font-bold">{profileData?.stats.totalWatched || 0}</span>
                    <span className="text-xs text-muted-foreground">Total Content</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Content tabs */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Watch History</TabsTrigger>
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Recently Watched</CardTitle>
                  <CardDescription>Your recently watched content</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-24 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-3 w-1/3" />
                        </div>
                      ))}
                    </div>
                  ) : profileData?.recentlyWatched && profileData.recentlyWatched.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {profileData.recentlyWatched.slice(0, 4).map((item) => (
                        <Link 
                          key={item.id} 
                          href={item.mediaType === "movie" 
                            ? `/movie/${item.mediaId}` 
                            : `/tv/${item.mediaId}${item.episodeId ? `/episode/${item.episodeId}` : ''}`
                          }
                        >
                          <div className="flex space-x-3 cursor-pointer hover:bg-accent p-2 rounded-md">
                            <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md">
                              <AspectRatio ratio={3/4}>
                                {item.content?.poster ? (
                                  <img
                                    src={item.content.poster}
                                    alt={item.content?.title || "Content thumbnail"}
                                    className="object-cover w-full h-full"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                                    {item.mediaType === "movie" ? (
                                      <Film className="h-8 w-8 text-muted-foreground" />
                                    ) : (
                                      <Tv className="h-8 w-8 text-muted-foreground" />
                                    )}
                                  </div>
                                )}
                              </AspectRatio>
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-1">
                                {item.content?.title}
                              </h4>
                              {item.mediaType === "tv" && item.episode && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  S{item.episode.season} E{item.episode.episode}: {item.episode.title}
                                </p>
                              )}
                              <div className="mt-auto">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(item.watchedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">
                      You haven't watched any content yet.
                    </p>
                  )}
                </CardContent>
                {profileData?.recentlyWatched && profileData.recentlyWatched.length > 4 && (
                  <CardFooter>
                    <button 
                      onClick={() => setActiveTab("history")}
                      className="w-full text-primary hover:underline text-sm"
                    >
                      View all watch history
                    </button>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Watch History</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : profileData?.recentlyWatched && profileData.recentlyWatched.length > 0 ? (
                    <div className="space-y-3">
                      {profileData.recentlyWatched.map((item) => (
                        <Link 
                          key={item.id} 
                          href={item.mediaType === "movie" 
                            ? `/movie/${item.mediaId}` 
                            : `/tv/${item.mediaId}${item.episodeId ? `/episode/${item.episodeId}` : ''}`
                          }
                        >
                          <div className="flex space-x-3 cursor-pointer hover:bg-accent p-2 rounded-md">
                            <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md">
                              {item.content?.poster ? (
                                <img
                                  src={item.content.poster}
                                  alt={item.content?.title || "Content thumbnail"}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-secondary flex items-center justify-center">
                                  {item.mediaType === "movie" ? (
                                    <Film className="h-6 w-6 text-muted-foreground" />
                                  ) : (
                                    <Tv className="h-6 w-6 text-muted-foreground" />
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col justify-center flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-1">
                                {item.content?.title}
                              </h4>
                              {item.mediaType === "tv" && item.episode && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  S{item.episode.season} E{item.episode.episode}: {item.episode.title}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Watched on {new Date(item.watchedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs font-medium rounded-full bg-primary/10 px-2 py-1">
                                {Math.round(item.progress / 60)} min
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground p-4">
                      Your watch history is empty.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="watchlist">
              <Card>
                <CardHeader>
                  <CardTitle>Your Watchlist</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      <p>Your watchlist items will appear here.</p>
                      <Link href="/" className="text-primary hover:underline block mt-2">
                        Browse content
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}