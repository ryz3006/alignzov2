'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  name: string;
  description: string;
  modules?: string[];
  taskCategories?: string[];
  workCategories?: string[];
  severityCategories?: string[];
  sourceCategories?: string[];
}

interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: Project[];
  apiCall: (url: string, options?: any) => Promise<Response>;
}

export function TimeEntryModal({ isOpen, onClose, onSuccess, projects, apiCall }: TimeEntryModalProps) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [description, setDescription] = useState('');
  const [module, setModule] = useState<string>('');
  const [taskCategory, setTaskCategory] = useState<string>('');
  const [workCategory, setWorkCategory] = useState<string>('');
  const [severityCategory, setSeverityCategory] = useState<string>('');
  const [sourceCategory, setSourceCategory] = useState<string>('');
  const [ticketReference, setTicketReference] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject || !description.trim()) {
      toast.error('Please select a project and enter a description');
      return;
    }

    // Validate required fields based on project configuration
    const selectedProjectData = projects.find(p => p.id === selectedProject);
    if (selectedProjectData) {
      if (selectedProjectData.modules && selectedProjectData.modules.length > 0 && !module) {
        toast.error('Please select a module');
        return;
      }
      if (selectedProjectData.taskCategories && selectedProjectData.taskCategories.length > 0 && !taskCategory) {
        toast.error('Please select a task category');
        return;
      }
      if (selectedProjectData.workCategories && selectedProjectData.workCategories.length > 0 && !workCategory) {
        toast.error('Please select a work category');
        return;
      }
      if (selectedProjectData.severityCategories && selectedProjectData.severityCategories.length > 0 && !severityCategory) {
        toast.error('Please select a severity category');
        return;
      }
      if (selectedProjectData.sourceCategories && selectedProjectData.sourceCategories.length > 0 && !sourceCategory) {
        toast.error('Please select a source category');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await apiCall('/api/time-sessions', {
        method: 'POST',
        body: JSON.stringify({
          projectId: selectedProject,
          description: description.trim(),
          module: module || undefined,
          taskCategory: taskCategory || undefined,
          workCategory: workCategory || undefined,
          severityCategory: severityCategory || undefined,
          sourceCategory: sourceCategory || undefined,
          ticketReference: ticketReference || undefined,
        }),
      });

      if (response.ok) {
        const newTimer = await response.json();
        toast.success('Timer started successfully');
        setDescription('');
        setSelectedProject('');
        setModule('');
        setTaskCategory('');
        setWorkCategory('');
        setSeverityCategory('');
        setSourceCategory('');
        setTicketReference('');
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to start timer');
      }
    } catch (error) {
      toast.error('Error starting timer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setDescription('');
      setSelectedProject('');
      setModule('');
      setTaskCategory('');
      setWorkCategory('');
      setSeverityCategory('');
      setSourceCategory('');
      setTicketReference('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Start New Timer" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
            Project *
          </label>
          <select
            id="project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            What are you working on? *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            placeholder="Enter a description of your work..."
            required
          />
        </div>

        {/* Project-specific fields - only show if project has configured attributes */}
        {selectedProject && (() => {
          const selectedProjectData = projects.find(p => p.id === selectedProject);
          if (!selectedProjectData) return null;

          return (
            <div className="space-y-4">
              {/* Module Selection */}
              {selectedProjectData.modules && selectedProjectData.modules.length > 0 && (
                <div>
                  <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-1">
                    Module *
                  </label>
                  <select
                    id="module"
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select a module</option>
                    {selectedProjectData.modules.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Task Category Selection */}
              {selectedProjectData.taskCategories && selectedProjectData.taskCategories.length > 0 && (
                <div>
                  <label htmlFor="taskCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Task Category *
                  </label>
                  <select
                    id="taskCategory"
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select a task category</option>
                    {selectedProjectData.taskCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Work Category Selection */}
              {selectedProjectData.workCategories && selectedProjectData.workCategories.length > 0 && (
                <div>
                  <label htmlFor="workCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Work Category *
                  </label>
                  <select
                    id="workCategory"
                    value={workCategory}
                    onChange={(e) => setWorkCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select a work category</option>
                    {selectedProjectData.workCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Severity Category Selection */}
              {selectedProjectData.severityCategories && selectedProjectData.severityCategories.length > 0 && (
                <div>
                  <label htmlFor="severityCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Severity Category *
                  </label>
                  <select
                    id="severityCategory"
                    value={severityCategory}
                    onChange={(e) => setSeverityCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select a severity category</option>
                    {selectedProjectData.severityCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Source Category Selection */}
              {selectedProjectData.sourceCategories && selectedProjectData.sourceCategories.length > 0 && (
                <div>
                  <label htmlFor="sourceCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Source Category *
                  </label>
                  <select
                    id="sourceCategory"
                    value={sourceCategory}
                    onChange={(e) => setSourceCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select a source category</option>
                    {selectedProjectData.sourceCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ticket Reference */}
              <div>
                <label htmlFor="ticketReference" className="block text-sm font-medium text-gray-700 mb-1">
                  Ticket Reference ID / Email Subject
                </label>
                <Input
                  id="ticketReference"
                  value={ticketReference}
                  onChange={(e) => setTicketReference(e.target.value)}
                  placeholder="e.g., JIRA-123, RE: Bug Report"
                  className="w-full"
                />
              </div>
            </div>
          );
        })()}

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !selectedProject || !description.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Starting...
              </div>
            ) : (
              <div className="flex items-center">
                <Play className="h-4 w-4 mr-2" />
                Start Timer
              </div>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
} 