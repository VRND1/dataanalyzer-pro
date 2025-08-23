import { useState } from 'react';
import { FiSearch, FiUsers, FiLock, FiGlobe, FiStar, FiMoreVertical, FiPlus } from 'react-icons/fi';

type Workspace = {
  id: string;
  name: string;
  description: string;
  members: number;
  visibility: 'public' | 'private';
  lastUpdated: string;
  isFavorite: boolean;
};

export function SharedWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: '1',
      name: 'Marketing Team',
      description: 'Campaign materials and marketing assets for Q3 launches',
      members: 12,
      visibility: 'private',
      lastUpdated: '2 hours ago',
      isFavorite: true,
    },
    {
      id: '2',
      name: 'Product Development',
      description: 'Roadmap and feature specifications for v2.0 release',
      members: 8,
      visibility: 'private',
      lastUpdated: '1 day ago',
      isFavorite: false,
    },
    {
      id: '3',
      name: 'Company Resources',
      description: 'Employee handbook, policies, and shared documents',
      members: 42,
      visibility: 'public',
      lastUpdated: '3 days ago',
      isFavorite: true,
    },
    {
      id: '4',
      name: 'Design System',
      description: 'UI components library and brand guidelines',
      members: 5,
      visibility: 'private',
      lastUpdated: '1 week ago',
      isFavorite: false,
    },
  ]);

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter workspaces based on search and active filter
  const filteredWorkspaces = workspaces.filter(workspace => {
    const matchesSearch = workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         workspace.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'favorites') return matchesSearch && workspace.isFavorite;
    if (activeFilter === 'teams') return matchesSearch && workspace.visibility === 'private';
    if (activeFilter === 'public') return matchesSearch && workspace.visibility === 'public';
    
    return matchesSearch;
  });

  const handleCreateWorkspace = () => {
    console.log('Create new workspace clicked');
    alert('This would open a workspace creation modal in a real app');
  };

  const handleFavoriteToggle = (workspaceId: string) => {
    setWorkspaces(workspaces.map(workspace => 
      workspace.id === workspaceId 
        ? { ...workspace, isFavorite: !workspace.isFavorite } 
        : workspace
    ));
  };

  const handleOpenWorkspace = (workspaceId: string) => {
    console.log(`Opening workspace ${workspaceId}`);
    alert(`This would open workspace ${workspaceId} in a real app`);
  };

  const handleLoadMore = () => {
    console.log('Load more workspaces');
    // In a real app, you would fetch more data here
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shared Workspaces</h1>
          <p className="text-gray-500 mt-1">Collaborate with your team in dedicated spaces</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search workspaces..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search workspaces"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={handleCreateWorkspace}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            aria-label="Create new workspace"
          >
            <FiPlus /> New
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <button 
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors font-medium ${
            activeFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
          aria-current={activeFilter === 'all' ? 'true' : undefined}
        >
          All Workspaces
        </button>
        <button 
          onClick={() => setActiveFilter('favorites')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeFilter === 'favorites' ? 'bg-blue-100 text-blue-800' : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
          aria-label="Show favorite workspaces"
        >
          <FiStar className="text-yellow-500" />
          Favorites
        </button>
        <button 
          onClick={() => setActiveFilter('teams')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeFilter === 'teams' ? 'bg-blue-100 text-blue-800' : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
          aria-label="Show workspaces with your teams"
        >
          <FiUsers className="text-purple-500" />
          My Teams
        </button>
        <button 
          onClick={() => setActiveFilter('public')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            activeFilter === 'public' ? 'bg-blue-100 text-blue-800' : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
          aria-label="Show public workspaces"
        >
          <FiGlobe className="inline mr-2 text-green-500" />
          Public
        </button>
      </div>

      {filteredWorkspaces.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-800 mb-2">No workspaces found</h3>
            <p className="text-gray-500 mb-6">Create a new workspace or adjust your filters</p>
            <button 
              onClick={handleCreateWorkspace}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Workspace
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((workspace) => (
              <div 
                key={workspace.id} 
                className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden hover:shadow-sm transition-all hover:border-blue-100 hover:translate-y-[-2px]"
                aria-labelledby={`workspace-${workspace.id}-title`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <h2 
                        id={`workspace-${workspace.id}-title`}
                        className="text-lg font-semibold text-gray-800"
                      >
                        {workspace.name}
                      </h2>
                      {workspace.visibility === 'private' ? (
                        <span className="sr-only">Private workspace</span>
                      ) : (
                        <span className="sr-only">Public workspace</span>
                      )}
                      <span className="inline-flex items-center">
                        {workspace.visibility === 'private' ? (
                          <FiLock className="text-gray-500" aria-hidden="true" />
                        ) : (
                          <FiGlobe className="text-blue-500" aria-hidden="true" />
                        )}
                      </span>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                      aria-label={`More options for ${workspace.name}`}
                    >
                      <FiMoreVertical aria-hidden="true" />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 mb-4 min-h-[3rem]">{workspace.description}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiUsers className="text-gray-400" aria-hidden="true" />
                      <span>
                        {workspace.members} {workspace.members === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    <span>Updated {workspace.lastUpdated}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex justify-between items-center">
                  <button 
                    onClick={() => handleFavoriteToggle(workspace.id)}
                    className="p-1 rounded-full hover:bg-yellow-50 transition-colors"
                    aria-label={workspace.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {workspace.isFavorite ? (
                      <FiStar className="text-yellow-500 fill-yellow-500" aria-hidden="true" />
                    ) : (
                      <FiStar className="text-gray-400 hover:text-yellow-500" aria-hidden="true" />
                    )}
                  </button>
                  <button 
                    onClick={() => handleOpenWorkspace(workspace.id)}
                    className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                    aria-label={`Open ${workspace.name} workspace`}
                  >
                    Open Workspace
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <button 
              onClick={handleLoadMore}
              className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              aria-label="Load more workspaces"
            >
              Load More Workspaces
            </button>
          </div>
        </>
      )}

      <div className="mt-12 bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-2">Need help with workspaces?</h3>
        <p className="text-gray-600 mb-4">Learn how to organize your team's work effectively using shared workspaces.</p>
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          View documentation →
        </button>
      </div>
    </div>
  );
}