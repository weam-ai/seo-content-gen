import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  X,
  Target,
  Building,
  FileText,
  ArrowLeft,
  ChevronDown,
  Check,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import projectService, { KeywordMetric } from '@/lib/services/project.service';
import PromptTypeService, {
  PromptType,
} from '@/lib/services/prompt-type.service';
// Removed userService and TeamMember for single-user application
import APIService from '@/lib/services/APIService';
// useAuthStore import removed - not used in single-user application
// Removed ManageTeamAssignmentModal for single-user application
import {
  RecommendedKeywordData,
  addKeywordsToProject,
} from '@/lib/services/topics.service';
import FetchingRecommendedKeyword from '@/components/article/FetchingRecommedKeyword';
import { usePasteHandler } from '@/utils/pasteParser';

// Add the Project interface locally since it is not exported from the service
interface Project {
  _id: string;
  name: string;
  website_url: string;
  created_at: string;
  description: string;
  keywords: KeywordMetric[];
  // Removed assign_member field for single-user application
  // Removed agency_name field for single-user application
}

// Article validation schema
const articleValidationSchema = Yup.object({
  name: Yup.string().required('Article title is required'),
  project_id: Yup.string().required('Project is required'),
  keywords: Yup.string().required('Primary keyword is required'),
  article_type_id: Yup.string().required('Article type is required'),
  // assigned_members removed for single-user application
  secondary_keywords: Yup.array().of(
    Yup.string().test(
      'unique-secondary-keyword',
      'This keyword is already used as the primary keyword or as another secondary keyword',
      function (value) {
        if (!value) return true;
        const { keywords, secondary_keywords } = this.parent || {};
        const normalizedValue = value.trim().toLowerCase();
        if (keywords && normalizedValue === keywords.trim().toLowerCase())
          return false;
        const secKeywords = Array.isArray(secondary_keywords)
          ? secondary_keywords
          : [];
        const count = secKeywords.filter(
          (kw: string) => kw && kw.trim().toLowerCase() === normalizedValue
        ).length;
        if (count > 1) return false;
        return true;
      }
    )
  ),
  outline_id: Yup.string().optional(),
});

// Topic validation schema
const topicValidationSchema = Yup.object({
  project_id: Yup.string().required('Project is required'),
  keywords: Yup.string()
    .required('Keyword is required')
    .test(
      'unique-keyword',
      '', // Remove project keyword validation message
      function () {
        return true; // No project keyword check
      }
    ),
  article_type_id: Yup.string().required('Article type is required'),
  secondary_keywords: Yup.array().of(
    Yup.string().test(
      'unique-secondary-keyword',
      'This keyword is already used as the primary keyword or as another secondary keyword',
      function (value) {
        if (!value) return true;
        // Get the primary keyword from parent context
        const { keywords, secondary_keywords } = this.parent || {};
        const normalizedValue = value.trim().toLowerCase();
        // Check against primary keyword
        if (keywords && normalizedValue === keywords.trim().toLowerCase())
          return false;
        // Check for duplicates among secondary keywords
        const secKeywords = Array.isArray(secondary_keywords)
          ? secondary_keywords
          : [];
        const count = secKeywords.filter(
          (kw: string) => kw && kw.trim().toLowerCase() === normalizedValue
        ).length;
        if (count > 1) return false;
        return true;
      }
    )
  ),
});

export default function ArticleAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectKeywords, setSelectedProjectKeywords] = useState<
    string[]
  >([]);
  const [newSecondaryKeyword, setNewSecondaryKeyword] = useState('');
  const [articleTypes, setArticleTypes] = useState<PromptType[]>([]);
  // Removed teamMembers state for single-user application
  // userData removed - not used in single-user application
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [showOutlineModal, setShowOutlineModal] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState<string>('');
  const [recommendedKeywords, setRecommendedKeywords] = useState<
    RecommendedKeywordData[]
  >([]);
  const [activeTab, setActiveTab] = useState('article');
  const [projectsPopoverOpen, setProjectsPopoverOpen] = useState(false);

  const projectFromUrl = searchParams.get('project') ?? '';

  // Article initial values
  const articleInitialValues = {
    name: '',
    project_id: projectFromUrl || '',
    keywords: '',
    article_type_id: '',
    // assigned_members removed for single-user application
    secondary_keywords: [] as string[],
    outline_id: '',
    outline_content: '',
  };

  // Topic initial values
  const topicInitialValues = {
    project_id: projectFromUrl || '',
    keywords: '',
    article_type_id: '',
    secondary_keywords: [] as string[],
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectService.getProjects({ limit: -1 });
        if (response.status) {
          setProjects(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch projects', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch projects',
          variant: 'destructive',
        });
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchArticleTypes = async () => {
      try {
        // Use different service methods based on active tab
        const response = activeTab === 'article'
          ? await PromptTypeService.getAllPromptTypes()
          : await PromptTypeService.getPromptTypes();
        if (response.status) {
          setArticleTypes(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch article types', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch article types',
          variant: 'destructive',
        });
      }
    };
    fetchArticleTypes();
  }, [activeTab]);

  // Removed fetchTeamMembers useEffect for single-user application

  const fetchProjectKeywords = async (projectId: string) => {
    try {
      const response = await projectService.getProjectKeywords(projectId);
      if (response.status) {
        setSelectedProjectKeywords(response.data.map((kw: any) => kw.keyword));
      }
    } catch (error) {
      console.error('Failed to fetch project keywords', error);
    }
  };

  // Fetch project details when project is selected
  useEffect(() => {
    if (projectFromUrl) {
      APIService.getProjectForEdit(projectFromUrl).then(
        (response: any) => {
          if (response.data?.status) {
            setProjectData(response.data.data);
          }
        }
      );
      // Also fetch project keywords
      fetchProjectKeywords(projectFromUrl);
    }
  }, [projectFromUrl]);

  // Article submission handler
  async function handleArticleSubmit(
    values: any,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) {
    try {
      // 1. Title uniqueness check
      const checkExistResult = await APIService.checkExistTitle(
        values.project_id,
        { title: values.name }
      );
      const existingTitle = checkExistResult.data.data?.existingTopic;
      if (existingTitle) {
        toast({
          title: 'Error',
          description: `You already have an existing title — "${existingTitle}"`,
          variant: 'destructive',
        });
        setSubmitting(false);
        return;
      }

      // 2. Fetch project details if not already fetched
      let projectDetails = projectData;
      if (!projectDetails) {
        const projectResponse = await APIService.getProjectForEdit(
          values.project_id
        );
        if (projectResponse.data?.status) {
          projectDetails = projectResponse.data.data;
          setProjectData(projectDetails);
        }
      }

      // 3. Build payload as plain object (not FormData)
      // Removed assigned_members for single-user application
      const payload: any = {
        project_id: values.project_id,
        // assigned_members removed for single-user application
        name: values.name,
        description: 'test description',
        prompt_type: values.article_type_id,
        secondary_keywords: values.secondary_keywords || [], // as array
        keywords: values.keywords,
        keyword_volume: '0',
        keyword_difficulty: 'MEDIUM',
      };
      if (projectDetails && projectDetails.website_url) {
        payload.website_url = projectDetails.website_url;
      }

      // 4. Create Article
      const response: any = await APIService.addTask(payload);
      if (response.data?.status) {
        toast({
          title: 'Success',
          description: 'Article created successfully!',
        });

        // 5. Generate outline
        const taskId = response.data?.data?.id;
        if (taskId) {
          try {
            const outlineResponse = await APIService.getArticleOutline(
              taskId,
              true
            );
            if (outlineResponse.data?.status) {
              setGeneratedOutline(outlineResponse.data.data?.outline || '');
              setShowOutlineModal(true);
            }
            // Remove warning toast if outline generation fails
          } catch (outlineError: any) {
            // Do not show a warning toast if outline generation fails
          }
        }

        // Navigate to articles list
        navigate('/articles');
      } else {
        toast({
          title: 'Error',
          description: response.data?.message || 'Failed to create article.',
          variant: 'destructive',
        });
        setSubmitting(false);
      }
    } catch (error: any) {
      console.error('❌ Error in handleSubmit:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  }

  // Topic submission handler
  async function handleTopicSubmit(
    values: any,
    { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
  ) {
    try {
      // Build keywords array for API (only primary keyword)
      const keywords = [
        {
          keyword: values.keywords.trim(),
          promptTypeId: values.article_type_id,
        },
      ];
      // Secondary keywords as a separate array
      const secondary_keywords = values.secondary_keywords.map(
        (kw: string) => kw.trim()
      );
      const response = await addKeywordsToProject(
        values.project_id,
        keywords,
        secondary_keywords
      );
      if (response.status) {
        toast({
          title: 'Success',
          description: 'Topic created successfully!',
        });
        navigate('/articles');
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create topic.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'An unknown error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="">
      {/* Back Button - Positioned below the logo */}
      <div className="container mx-auto px-4 mt-4">
        <Button variant="ghost" className="gap-2 pl-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title={activeTab === 'article' ? 'Create Article with Manual Title' : 'Generate Content with AI'}
            description={activeTab === 'article'
              ? 'Create your article by manually entering the title and comprehensive details'
              : 'Let AI generate content topics and titles based on your keywords and preferences'
            }
          />

          {/* Tab Toggle */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="article" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manual Title Entry
              </TabsTrigger>
              <TabsTrigger value="topic" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                AI-Powered Generation
              </TabsTrigger>
            </TabsList>
            {/* Article Form */}
            <TabsContent value="article">
              <Formik
                initialValues={articleInitialValues}
                validationSchema={articleValidationSchema}
                validateOnChange={true}
                validateOnBlur={true}
                context={{ selectedProjectKeywords }}
                onSubmit={handleArticleSubmit}
              >
                {({
                  values,
                  errors,
                  touched,
                  isSubmitting,
                  getFieldProps,
                  setFieldValue,
                  setFieldTouched,
                }) => (
                  <Form className="space-y-8">
                    {/* Article Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                          Article Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Article Title *</Label>
                          <Input
                            id="name"
                            {...getFieldProps('name')}
                            placeholder="Enter article title"
                          />
                          {touched.name && errors.name ? (
                            <div className="text-red-500 text-xs">
                              {errors.name}
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Project Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                          Project Selection
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="project_id">Project *</Label>
                          <Popover
                            open={projectsPopoverOpen}
                            onOpenChange={setProjectsPopoverOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between"
                                aria-expanded={projectsPopoverOpen}
                              >
                                <span className="truncate">
                                  {values.project_id
                                    ? projects.find((p) => p._id === values.project_id)?.name || 'Select a project'
                                    : 'Select a project'}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-full">
                              <Command>
                                <CommandInput placeholder="Search projects..." />
                                <CommandList>
                                  {projects.length === 0 ? (
                                    <CommandEmpty>No projects found.</CommandEmpty>
                                  ) : (
                                    projects.map((project) => (
                                      <CommandItem
                                        key={project._id}
                            value={`${project._id}|||${project.name.toLowerCase()}`}
                                        onSelect={async (v) => {
                                          const id = v.split('|||')[0];
                                          await setFieldValue('project_id', id);
                                          setProjectsPopoverOpen(false);
                                          setTimeout(() => {
                                            setFieldTouched('project_id', true);
                                          }, 0);
                                          if (id) {
                                            fetchProjectKeywords(id);
                                          }
                                        }}
                                      >
                                        <Check
                                          className={
                                            values.project_id === project._id
                                              ? 'mr-2 h-4 w-4 opacity-100'
                                              : 'mr-2 h-4 w-4 opacity-0'
                                          }
                                        />
                                        {project.name}
                                      </CommandItem>
                                    ))
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {touched.project_id && errors.project_id ? (
                            <div className="text-red-500 text-xs">
                              {errors.project_id}
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Keywords & Article Type */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                          Keywords & Article Type
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="keywords">Primary Keyword *</Label>
                          <Input
                            id="keywords"
                            {...getFieldProps('keywords')}
                            placeholder="Enter primary keyword"
                          />
                          {touched.keywords && errors.keywords ? (
                            <div className="text-red-500 text-xs">
                              {errors.keywords}
                            </div>
                          ) : null}
                        </div>

                        {/* Article Type Dropdown */}
                        <div className="space-y-2">
                          <Label htmlFor="article_type_id">Article Type *</Label>
                          <Select
                            value={values.article_type_id}
                            onValueChange={(value) =>
                              setFieldValue('article_type_id', value)
                            }
                            onOpenChange={(isOpen) => {
                              if (!isOpen) {
                                setFieldTouched('article_type_id', true);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select article type" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <ScrollArea className="h-full">
                                {articleTypes.map((type) => (
                                  <SelectItem key={type._id} value={type._id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                          {touched.article_type_id && errors.article_type_id ? (
                            <div className="text-red-500 text-xs">
                              {errors.article_type_id}
                            </div>
                          ) : null}
                        </div>

                        {/* Show existing project keywords */}
                        {selectedProjectKeywords.length > 0 && (
                          <div className="space-y-2">
                            <Label>Existing Project Keywords</Label>
                            <div className="flex flex-wrap gap-2">
                              {selectedProjectKeywords.map((keyword, index) => (
                                <Badge
                                  key={`project-keyword-${keyword}-${index}`}
                                  variant="secondary"
                                  className="opacity-60"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Secondary Keywords */}
                        <FieldArray
                          name="secondary_keywords"
                          render={(arrayHelpers) => (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>Secondary Keywords (Optional)</Label>
                                <FetchingRecommendedKeyword
                                  primaryKeyword={values.keywords}
                                  onFinish={(keywords) =>
                                    setRecommendedKeywords(keywords)
                                  }
                                />
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  value={newSecondaryKeyword}
                                  onChange={(e) =>
                                    setNewSecondaryKeyword(e.target.value)
                                  }
                                  placeholder="Enter secondary keyword or paste from spreadsheet"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (newSecondaryKeyword.trim()) {
                                        const keyword = newSecondaryKeyword
                                          .trim()
                                          .toLowerCase();
                                        if (
                                          values.keywords.trim().toLowerCase() ===
                                          keyword
                                        ) {
                                          toast({
                                            title: 'Error',
                                            description:
                                              'This keyword is already used as the primary keyword',
                                            variant: 'destructive',
                                          });
                                          return;
                                        }
                                        if (
                                          values.secondary_keywords.some(
                                            (kw: string) =>
                                              kw.trim().toLowerCase() === keyword
                                          )
                                        ) {
                                          toast({
                                            title: 'Error',
                                            description:
                                              'This secondary keyword is already added',
                                            variant: 'destructive',
                                          });
                                          return;
                                        }
                                        arrayHelpers.push(
                                          newSecondaryKeyword.trim()
                                        );
                                        setNewSecondaryKeyword('');
                                      }
                                    }
                                  }}
                                  onPaste={usePasteHandler(
                                    (items) => {
                                      // Filter out duplicates and invalid keywords
                                      const validItems = items.filter((item) => {
                                        const keyword = item.trim().toLowerCase();
                                        // Skip empty items
                                        if (!keyword) return false;
                                        // Skip if matches primary keyword
                                        if (
                                          values.keywords.trim().toLowerCase() ===
                                          keyword
                                        )
                                          return false;
                                        // Skip if already in secondary keywords
                                        if (
                                          values.secondary_keywords.some(
                                            (kw: string) =>
                                              kw.trim().toLowerCase() === keyword
                                          )
                                        )
                                          return false;
                                        return true;
                                      });

                                      if (validItems.length > 0) {
                                        // Add all valid items to secondary keywords
                                        validItems.forEach((item) => {
                                          arrayHelpers.push(item.trim());
                                        });

                                        // Clear the input field
                                        setNewSecondaryKeyword('');

                                        // Show success message
                                        toast({
                                          title: 'Success',
                                          description: `Added ${validItems.length
                                            } keyword${validItems.length > 1 ? 's' : ''
                                            } from pasted content`,
                                        });
                                      } else {
                                        toast({
                                          title: 'Info',
                                          description:
                                            'No new valid keywords found in pasted content',
                                          variant: 'default',
                                        });
                                      }
                                    },
                                    {
                                      trimItems: true,
                                      filterEmpty: true,
                                      itemSeparator: ',',
                                    }
                                  )}
                                />
                                <Button
                                  type="button"
                                  onClick={() => {
                                    if (newSecondaryKeyword.trim()) {
                                      const keyword = newSecondaryKeyword
                                        .trim()
                                        .toLowerCase();
                                      if (
                                        values.keywords.trim().toLowerCase() ===
                                        keyword
                                      ) {
                                        toast({
                                          title: 'Error',
                                          description:
                                            'This keyword is already used as the primary keyword',
                                          variant: 'destructive',
                                        });
                                        return;
                                      }
                                      if (
                                        values.secondary_keywords.some(
                                          (kw: string) =>
                                            kw.trim().toLowerCase() === keyword
                                        )
                                      ) {
                                        toast({
                                          title: 'Error',
                                          description:
                                            'This secondary keyword is already added',
                                          variant: 'destructive',
                                        });
                                        return;
                                      }
                                      arrayHelpers.push(newSecondaryKeyword.trim());
                                      setNewSecondaryKeyword('');
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              {/* Helper text for paste functionality */}
                              <div className="text-xs text-muted-foreground mt-1">
                                Tip: You can paste multiple keywords from Google
                                Sheets or Excel. They'll be automatically separated
                                and added.
                              </div>
                              {newSecondaryKeyword.trim() &&
                                values.keywords.trim().toLowerCase() ===
                                newSecondaryKeyword.trim().toLowerCase() && (
                                  <div className="text-red-500 text-xs mt-1">
                                    This keyword is already used as the primary
                                    keyword
                                  </div>
                                )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {values.secondary_keywords?.map(
                                  (keyword, index) => (
                                    <div
                                      key={`secondary-keyword-${keyword}-${index}`}
                                      className="flex flex-col items-start gap-1"
                                    >
                                      <Badge
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                      >
                                        {keyword}
                                        <button
                                          type="button"
                                          onClick={() => arrayHelpers.remove(index)}
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                      {touched.secondary_keywords &&
                                        Array.isArray(touched.secondary_keywords) &&
                                        touched.secondary_keywords[index] &&
                                        errors.secondary_keywords &&
                                        Array.isArray(errors.secondary_keywords) &&
                                        errors.secondary_keywords[index] ? (
                                        <div className="text-red-500 text-xs">
                                          {errors.secondary_keywords[index]}
                                        </div>
                                      ) : null}
                                    </div>
                                  )
                                )}
                              </div>
                              {/* Recommended Keywords Display - Below Secondary Keywords */}
                              {recommendedKeywords.length > 0 && (
                                <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                                  <Label className="text-sm font-medium mb-2 block">
                                    Recommended Keywords
                                  </Label>
                                  <div className="flex flex-wrap gap-2">
                                    {recommendedKeywords
                                      .filter((keyword) => {
                                        const keywordText = keyword.keyword
                                          .trim()
                                          .toLowerCase();
                                        const primaryKeyword = values.keywords
                                          .trim()
                                          .toLowerCase();
                                        const secondaryKeywords =
                                          values.secondary_keywords.map(
                                            (kw: string) => kw.trim().toLowerCase()
                                          );

                                        // Exclude primary keyword and already added secondary keywords
                                        return (
                                          keywordText !== primaryKeyword &&
                                          !secondaryKeywords.includes(keywordText)
                                        );
                                      })
                                      .map((keyword, index) => (
                                        <Badge
                                          key={`recommended-keyword-${keyword.keyword}-${index}`}
                                          variant="outline"
                                          className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-2"
                                          onClick={() => {
                                            const keywordText =
                                              keyword.keyword.trim();
                                            // Add to secondary keywords (no need for validation since we already filtered)
                                            arrayHelpers.push(keywordText);
                                            toast({
                                              title: 'Added',
                                              description:
                                                'Keyword added to secondary keywords',
                                            });
                                          }}
                                        >
                                          <span>{keyword.keyword}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {keyword.search_volume.toLocaleString()}
                                          </span>
                                          <Plus className="h-3 w-3 ml-1" />
                                        </Badge>
                                      ))}
                                  </div>
                                  {recommendedKeywords.filter((keyword) => {
                                    const keywordText = keyword.keyword
                                      .trim()
                                      .toLowerCase();
                                    const primaryKeyword = values.keywords
                                      .trim()
                                      .toLowerCase();
                                    const secondaryKeywords =
                                      values.secondary_keywords.map((kw: string) =>
                                        kw.trim().toLowerCase()
                                      );
                                    return (
                                      keywordText !== primaryKeyword &&
                                      !secondaryKeywords.includes(keywordText)
                                    );
                                  }).length === 0 ? (
                                    <div className="text-sm text-muted-foreground text-center py-4">
                                      All recommended keywords have been added or
                                      are already in use
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground mt-2">
                                      Click on a keyword to add it to secondary
                                      keywords
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        />
                      </CardContent>
                    </Card>



                    {/* Outline Generation (Redesigned) */}
                    {/**
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                      Article Outline
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (values.keywords && values.article_type_id) {
                          generateOutline(values.keywords, values.article_type_id);
                        } else {
                          toast({
                            title: 'Error',
                            description: 'Please select a primary keyword and article type first',
                            variant: 'destructive',
                          });
                        }
                      }}
                      disabled={isGeneratingOutline || !values.keywords || !values.article_type_id}
                    >
                      {isGeneratingOutline ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="outline_content">Outline Content</Label>
                      <Textarea
                        id="outline_content"
                        {...getFieldProps('outline_content')}
                        placeholder="Enter the content outline..."
                        className="min-h-[200px] font-mono text-sm bg-muted/30 p-4 rounded-lg border"
                      />
                    </div>
                  </CardContent>
                </Card>
                **/}

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/articles')}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[hsl(var(--razor-primary))] text-white"
                      >
                        {isSubmitting ? 'Creating...' : 'Create Article'}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </TabsContent>

            {/* Topic Form */}
            <TabsContent value="topic">
              <Formik
                initialValues={topicInitialValues}
                validationSchema={topicValidationSchema}
                validateOnChange={true}
                validateOnBlur={true}
                context={{ selectedProjectKeywords }}
                onSubmit={handleTopicSubmit}
              >
                {({
                  values,
                  errors,
                  touched,
                  isSubmitting,
                  getFieldProps,
                  setFieldValue,
                  setFieldTouched,
                }) => (
                  <Form className="space-y-8">
                    {/* Project Selection */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                          Project Selection
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="project_id">Project *</Label>
                          <Popover
                            open={projectsPopoverOpen}
                            onOpenChange={setProjectsPopoverOpen}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-between"
                                aria-expanded={projectsPopoverOpen}
                              >
                                <span className="truncate">
                                  {values.project_id
                                    ? projects.find((p) => p._id === values.project_id)?.name || 'Select a project'
                                    : 'Select a project'}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-full">
                              <Command>
                                <CommandInput placeholder="Search projects..." />
                                <CommandList>
                                  {projects.length === 0 ? (
                                    <CommandEmpty>No projects found.</CommandEmpty>
                                  ) : (
                                    projects.map((project) => (
                                      <CommandItem
                                        key={project._id}
                            value={`${project._id}|||${project.name.toLowerCase()}`}
                                        onSelect={async (v) => {
                                          const id = v.split('|||')[0];
                                          await setFieldValue('project_id', id);
                                          setProjectsPopoverOpen(false);
                                          setTimeout(() => {
                                            setFieldTouched('project_id', true);
                                          }, 0);
                                          if (id) {
                                            fetchProjectKeywords(id);
                                          }
                                        }}
                                      >
                                        <Check
                                          className={
                                            values.project_id === project._id
                                              ? 'mr-2 h-4 w-4 opacity-100'
                                              : 'mr-2 h-4 w-4 opacity-0'
                                          }
                                        />
                                        {project.name}
                                      </CommandItem>
                                    ))
                                  )}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {touched.project_id && errors.project_id ? (
                            <div className="text-red-500 text-xs">
                              {errors.project_id}
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Keywords */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                          Keywords & SEO
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="keywords">Primary Keyword *</Label>
                          <Input
                            id="keywords"
                            {...getFieldProps('keywords')}
                            placeholder="Enter primary keyword"
                            className="flex-1"
                          />
                          {touched.keywords && errors.keywords ? (
                            <div className="text-red-500 text-xs">
                              {errors.keywords}
                            </div>
                          ) : null}
                        </div>

                        {/* Article Type Dropdown */}
                        <div className="space-y-2">
                          <Label htmlFor="article_type_id">Article Type *</Label>
                          <Select
                            value={values.article_type_id}
                            onValueChange={(value) =>
                              setFieldValue('article_type_id', value)
                            }
                            onOpenChange={(isOpen) => {
                              if (!isOpen) {
                                setFieldTouched('article_type_id', true);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select article type" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <ScrollArea className="h-full">
                                {articleTypes.map((type) => (
                                  <SelectItem key={type._id} value={type._id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                          {touched.article_type_id && errors.article_type_id ? (
                            <div className="text-red-500 text-xs">
                              {errors.article_type_id}
                            </div>
                          ) : null}
                        </div>

                        {/* Show existing project keywords */}
                        {selectedProjectKeywords.length > 0 && (
                          <div className="space-y-2">
                            <Label>Existing Project Keywords</Label>
                            <div className="flex flex-wrap gap-2">
                              {selectedProjectKeywords.map((keyword, index) => (
                                <Badge
                                  key={`selected-project-keyword-${keyword}-${index}`}
                                  variant="secondary"
                                  className="opacity-60"
                                >
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Secondary Keywords */}
                        <FieldArray
                          name="secondary_keywords"
                          render={(arrayHelpers) => (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label>Secondary Keywords (Optional) </Label>
                                <FetchingRecommendedKeyword
                                  primaryKeyword={values.keywords}
                                  onFinish={(keywords) =>
                                    setRecommendedKeywords(keywords)
                                  }
                                />
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  value={newSecondaryKeyword}
                                  onChange={(e) =>
                                    setNewSecondaryKeyword(e.target.value)
                                  }
                                  placeholder="Enter secondary keyword or paste from spreadsheet"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (newSecondaryKeyword.trim()) {
                                        const keyword = newSecondaryKeyword
                                          .trim()
                                          .toLowerCase();
                                        // Check against primary keyword
                                        if (
                                          values.keywords.trim().toLowerCase() ===
                                          keyword
                                        ) {
                                          toast({
                                            title: 'Error',
                                            description:
                                              'This keyword is already used as the primary keyword',
                                            variant: 'destructive',
                                          });
                                          return;
                                        }
                                        // Check for duplicates among secondary keywords
                                        if (
                                          values.secondary_keywords.some(
                                            (kw: string) =>
                                              kw.trim().toLowerCase() === keyword
                                          )
                                        ) {
                                          toast({
                                            title: 'Error',
                                            description:
                                              'This secondary keyword is already added',
                                            variant: 'destructive',
                                          });
                                          return;
                                        }
                                        arrayHelpers.push(
                                          newSecondaryKeyword.trim()
                                        );
                                        setNewSecondaryKeyword('');
                                      }
                                    }
                                  }}
                                  onPaste={usePasteHandler(
                                    (items) => {
                                      // Filter out duplicates and invalid keywords
                                      const validItems = items.filter((item) => {
                                        const keyword = item.trim().toLowerCase();
                                        // Skip empty items
                                        if (!keyword) return false;
                                        // Skip if matches primary keyword
                                        if (
                                          values.keywords.trim().toLowerCase() ===
                                          keyword
                                        )
                                          return false;
                                        // Skip if already in secondary keywords
                                        if (
                                          values.secondary_keywords.some(
                                            (kw: string) =>
                                              kw.trim().toLowerCase() === keyword
                                          )
                                        )
                                          return false;
                                        return true;
                                      });

                                      if (validItems.length > 0) {
                                        // Add all valid items to secondary keywords
                                        validItems.forEach((item) => {
                                          arrayHelpers.push(item.trim());
                                        });

                                        // Clear the input field
                                        setNewSecondaryKeyword('');

                                        // Show success message
                                        toast({
                                          title: 'Success',
                                          description: `Added ${validItems.length
                                            } keyword${validItems.length > 1 ? 's' : ''
                                            } from pasted content`,
                                        });
                                      } else {
                                        toast({
                                          title: 'Info',
                                          description:
                                            'No new valid keywords found in pasted content',
                                          variant: 'default',
                                        });
                                      }
                                    },
                                    {
                                      trimItems: true,
                                      filterEmpty: true,
                                      itemSeparator: ',',
                                    }
                                  )}
                                />
                                <Button
                                  type="button"
                                  onClick={() => {
                                    if (newSecondaryKeyword.trim()) {
                                      const keyword = newSecondaryKeyword
                                        .trim()
                                        .toLowerCase();
                                      // Check against primary keyword
                                      if (
                                        values.keywords.trim().toLowerCase() ===
                                        keyword
                                      ) {
                                        toast({
                                          title: 'Error',
                                          description:
                                            'This keyword is already used as the primary keyword',
                                          variant: 'destructive',
                                        });
                                        return;
                                      }
                                      // Check for duplicates among secondary keywords
                                      if (
                                        values.secondary_keywords.some(
                                          (kw: string) =>
                                            kw.trim().toLowerCase() === keyword
                                        )
                                      ) {
                                        toast({
                                          title: 'Error',
                                          description:
                                            'This secondary keyword is already added',
                                          variant: 'destructive',
                                        });
                                        return;
                                      }
                                      arrayHelpers.push(newSecondaryKeyword.trim());
                                      setNewSecondaryKeyword('');
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              {/* Helper text for paste functionality */}
                              <div className="text-xs text-muted-foreground mt-1">
                                Tip: You can paste multiple keywords from Google
                                Sheets or Excel. They'll be automatically separated
                                and added.
                              </div>

                              {/* Real-time error for new secondary keyword input */}
                              {newSecondaryKeyword.trim() &&
                                values.keywords.trim().toLowerCase() ===
                                newSecondaryKeyword.trim().toLowerCase() && (
                                  <div className="text-red-500 text-xs mt-1">
                                    This keyword is already used as the primary
                                    keyword
                                  </div>
                                )}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {values.secondary_keywords?.map(
                                  (keyword, index) => (
                                    <div
                                      key={`secondary-keyword-${keyword}-${index}`}
                                      className="flex flex-col items-start gap-1"
                                    >
                                      <Badge
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                      >
                                        {keyword}
                                        <button
                                          type="button"
                                          onClick={() => arrayHelpers.remove(index)}
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                      {/* Show error for this secondary keyword if exists */}
                                      {touched.secondary_keywords &&
                                        Array.isArray(touched.secondary_keywords) &&
                                        touched.secondary_keywords[index] &&
                                        errors.secondary_keywords &&
                                        Array.isArray(errors.secondary_keywords) &&
                                        errors.secondary_keywords[index] ? (
                                        <div className="text-red-500 text-xs">
                                          {errors.secondary_keywords[index]}
                                        </div>
                                      ) : null}
                                    </div>
                                  )
                                )}
                              </div>

                              {/* Recommended Keywords Display - Below Secondary Keywords */}
                              {recommendedKeywords.length > 0 && (
                                <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                                  <Label className="text-sm font-medium mb-2 block">
                                    Recommended Keywords
                                  </Label>
                                  <div className="flex flex-wrap gap-2">
                                    {recommendedKeywords
                                      .filter((keyword) => {
                                        const keywordText = keyword.keyword
                                          .trim()
                                          .toLowerCase();
                                        const primaryKeyword = values.keywords
                                          .trim()
                                          .toLowerCase();
                                        const secondaryKeywords =
                                          values.secondary_keywords.map(
                                            (kw: string) => kw.trim().toLowerCase()
                                          );

                                        // Exclude primary keyword and already added secondary keywords
                                        return (
                                          keywordText !== primaryKeyword &&
                                          !secondaryKeywords.includes(keywordText)
                                        );
                                      })
                                      .map((keyword, index) => (
                                        <Badge
                                          key={`filtered-recommended-keyword-${keyword.keyword}-${index}`}
                                          variant="outline"
                                          className="cursor-pointer hover:bg-primary/10 transition-colors flex items-center gap-2"
                                          onClick={() => {
                                            const keywordText =
                                              keyword.keyword.trim();
                                            // Add to secondary keywords (no need for validation since we already filtered)
                                            arrayHelpers.push(keywordText);
                                            toast({
                                              title: 'Added',
                                              description:
                                                'Keyword added to secondary keywords',
                                            });
                                          }}
                                        >
                                          <span>{keyword.keyword}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {keyword.search_volume.toLocaleString()}
                                          </span>
                                          <Plus className="h-3 w-3 ml-1" />
                                        </Badge>
                                      ))}
                                  </div>
                                  {recommendedKeywords.filter((keyword) => {
                                    const keywordText = keyword.keyword
                                      .trim()
                                      .toLowerCase();
                                    const primaryKeyword = values.keywords
                                      .trim()
                                      .toLowerCase();
                                    const secondaryKeywords =
                                      values.secondary_keywords.map((kw: string) =>
                                        kw.trim().toLowerCase()
                                      );
                                    return (
                                      keywordText !== primaryKeyword &&
                                      !secondaryKeywords.includes(keywordText)
                                    );
                                  }).length === 0 ? (
                                    <div className="text-sm text-muted-foreground text-center py-4">
                                      All recommended keywords have been added or
                                      are already in use
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground mt-2">
                                      Click on a keyword to add it to secondary
                                      keywords
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/topics')}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[hsl(var(--razor-primary))] text-white"
                      >
                        {isSubmitting ? 'Creating...' : 'Create Topic'}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Outline Modal */}
      {showOutlineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Generated Outline</h2>
              <button
                onClick={() => setShowOutlineModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">
                {generatedOutline}
              </pre>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setShowOutlineModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
