import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ProjectService from '@/lib/services/project.service';
import PromptTypeService, {
  PromptType,
} from '@/lib/services/prompt-type.service';
import GuidelineService, { Guideline } from '@/lib/services/guideline.service';
import { toast } from '@/components/ui/use-toast';
import { PageHeader } from '@/components/ui/page-header';
import {
  Plus,
  X,
  Globe,
  Target,
  FileText,
  ArrowLeft,
  Building,
  Globe2,
  Sparkles,
} from 'lucide-react';
import { languageOptions } from '@/lib/mock-data';
// Removed UserService and TeamMember for single-user application
import MDEditor from '@uiw/react-md-editor';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { AsyncPaginate } from 'react-select-async-paginate';
import locationService from '@/lib/services/location.service';

import { GroupBase, OptionsOrGroups } from 'react-select';
// Removed ManageTeamAssignmentModal for single-user application
// AssignedToMember import removed for single-user application
import { createFileImportHandler } from '@/utils/parseFile.util';

interface KeywordInput {
  keyword: string;
  promptTypeId: string;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Project name is required'),
  website_url: Yup.string()
    .url('Must be a valid URL')
    .required('Website URL is required'),
  language: Yup.string().required('Language is required'),
  location: Yup.array()
    .of(
      Yup.object().shape({
        value: Yup.string().required(),
        label: Yup.string().required(),
      })
    )
    .min(1, 'At least one location is required')
    .required('Location is required'),
  description: Yup.string().required('Business description is required'),
  author_bio: Yup.string(),
  organization_archetype: Yup.string(),
  brand_spokesperson: Yup.string(),
  most_important_thing: Yup.string(),
  unique_differentiator: Yup.string(),
  competitors_websites: Yup.array().of(
    Yup.string().url('Each competitor must be a valid URL')
  ),
  // assign_to validation removed for single-user application
  guideline_id: Yup.string().required('An industry guideline must be selected'),
  guideline_description: Yup.string(),
  targeted_audience: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one target audience is required')
    .required('Targeted audience is required'),
});

export default function EditProject() {
  const navigate = useNavigate();
  const params = useParams();
  const projectId = params.id as string;
  const [initialValues, setInitialValues] = useState<any>(null);
  const [promptTypes, setPromptTypes] = useState<PromptType[]>([]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  // Removed teamMembers state for single-user application
  const [loading, setLoading] = useState(true);
  const [targetedKeywords, setTargetedKeywords] = useState<KeywordInput[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newAudience, setNewAudience] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const websiteUrlRef = useRef<HTMLInputElement>(null);
  // assignedMembers state removed for single-user application
  const formRef = useRef<any>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Helper to scroll to first error field (used only on submit)
  const scrollToFirstError = (errors: any) => {
    if (!errors) return;
    const getFirstErrorKey = (obj: any, prefix = ''): string | null => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          return prefix ? `${prefix}.${key}` : key;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          const nested = getFirstErrorKey(
            obj[key],
            prefix ? `${prefix}.${key}` : key
          );
          if (nested) return nested;
        }
      }
      return null;
    };
    const firstErrorKey = getFirstErrorKey(errors);
    if (firstErrorKey) {
      const fieldId = firstErrorKey.replace(/\.(\d+)/g, '-$1');
      const el = document.getElementById(fieldId);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus?.();
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [promptRes, guidelineRes, , projectRes] =
          await Promise.all([
            PromptTypeService.getAllPromptTypes(),
            GuidelineService.getGuidelines(),
            // Removed getTeamMembers for single-user application
            Promise.resolve({ status: true, data: [] }),
            ProjectService.getProjectById(projectId),
          ]);

        if (promptRes.status) setPromptTypes(promptRes.data);
        if (guidelineRes.status) setGuidelines(guidelineRes.data);
        // Removed setTeamMembers for single-user application

        if (projectRes.status && projectRes.data) {
          // Map API response to form fields
          const projectData = projectRes.data;

          // Fetch targeted keywords separately
          try {
            const keywordsResponse = await ProjectService.getProjectKeywords(
              projectId
            );
            if (keywordsResponse.status && keywordsResponse.data) {
              const keywords = keywordsResponse.data.map((k: any) => ({
                keyword: k.keyword,
                promptTypeId: k.prompt_type_id,
              }));
              setTargetedKeywords(keywords);
            }
          } catch (error) {
            console.error('Failed to fetch keywords:', error);
          }

          setInitialValues({
            name: projectData.name || '',
            website_url: projectData.website_url || '',
            language: projectData.language || '',
            location: (projectData.location || []).map((loc: string) => ({
              value: loc,
              label: loc,
            })),
            // assign_to field removed for single-user application
            competitors_websites: projectData.competitors_websites || [],
            guideline_id: projectData.guideline?.id || '',
            guideline_description: projectData.guideline_description || '',
            targeted_audience: Array.isArray(projectData.targeted_audience)
              ? projectData.targeted_audience
              : (projectData.targeted_audience || '')
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean),
            description: projectData.description || '',
            author_bio: projectData.author_bio || '',
            organization_archetype: projectData.organization_archetype || '',
            brand_spokesperson: projectData.brand_spokesperson || '',
            most_important_thing: projectData.most_important_thing || '',
            unique_differentiator: projectData.unique_differentiator || '',
          });
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load project data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  useEffect(() => {
    // fetchAssigned function removed for single-user application
  }, [projectId]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        location: values.location.map((loc: any) => loc.label),
        targeted_audience: (values.targeted_audience || []).join(', '),
        author_bio: values.author_bio,
        organization_archetype: values.organization_archetype,
        brand_spokesperson: values.brand_spokesperson,
        most_important_thing: values.most_important_thing,
        unique_differentiator: values.unique_differentiator,
      };

      const response = await ProjectService.updateProject(projectId, payload);

      if (response.status) {
        toast({
          title: 'Success',
          description: 'Project updated successfully!',
        });
        navigate(`/projects/${projectId}`);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to update project.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update project.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !initialValues) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[hsl(var(--razor-primary))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Back Button - Positioned below the logo */}
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="gap-2 mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <main className="container mx-auto">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Edit Project"
            description="Update your content writing project settings"
          />
          <CardContent className="p-8">
            <Formik
              innerRef={formRef}
              initialValues={initialValues}
              validationSchema={validationSchema}
              validateOnChange={hasSubmitted}
              validateOnBlur={hasSubmitted}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                touched,
                isSubmitting,
                validateForm,
                getFieldProps,
                setFieldValue,
                setTouched,
                submitForm,
              }) => {
                // Custom submit handler for scroll-to-error
                const handleCustomSubmit = async (e: React.FormEvent) => {
                  e.preventDefault();
                  setHasSubmitted(true);
                  setTouched({
                    name: true,
                    language: true,
                    website_url: true,
                    location: Array.isArray(values.location)
                      ? values.location.map(() => ({
                          value: true,
                          label: true,
                        }))
                      : [],
                    // assign_to removed for single-user application
                    competitors_websites: true,
                    targeted_keywords: Array.isArray(values.targeted_keywords)
                      ? values.targeted_keywords.map(() => ({
                          keyword: true,
                          promptTypeId: true,
                        }))
                      : [],
                    guideline_id: true,
                    guideline_description: true,
                    targeted_audience: true,
                    description: true,
                    author_bio: true,
                    organization_archetype: true,
                    brand_spokesperson: true,
                    most_important_thing: true,
                    unique_differentiator: true,
                  });
                  const formErrors = await validateForm();
                  if (formErrors && Object.keys(formErrors).length > 0) {
                    scrollToFirstError(formErrors);
                    return;
                  }
                  submitForm();
                };

                // handleAssignChange function removed for single-user application

                const generateWithAI = async () => {
                  if (!values.website_url) {
                    setFieldValue('website_url', values.website_url, true);
                    toast({
                      title: 'Website URL required',
                      description:
                        'Please enter a website URL to generate insights with AI.',
                      variant: 'destructive',
                    });
                    websiteUrlRef.current?.focus();
                    return;
                  }

                  setIsGenerating(true);
                  try {
                    const response =
                      await ProjectService.generateBusinessSummary({
                        website_url: values.website_url,
                      });

                    if (response.status && response.data) {
                      const { company_details, target_audience, owner_bio } =
                        response.data;
                      setFieldValue('description', company_details);
                      setFieldValue('targeted_audience', target_audience);
                      setFieldValue('author_bio', owner_bio);

                      toast({
                        title: 'Success',
                        description: 'AI insights generated successfully.',
                      });
                    } else {
                      toast({
                        title: 'Error',
                        description:
                          response.message || 'Failed to generate insights.',
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
                    setIsGenerating(false);
                  }
                };

                return (
                  <Form className="space-y-6" onSubmit={handleCustomSubmit}>
                    {/* Basic Information */}
                    <Card className="hover-lift">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                          Basic Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Project Name *</Label>
                            <Input
                              id="name"
                              {...getFieldProps('name')}
                              placeholder="Enter project name"
                            />
                            {touched.name && errors.name ? (
                              <div className="text-red-500 text-xs">
                                {String(errors.name)}
                              </div>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="language">Language *</Label>
                            <Select
                              value={values.language}
                              onValueChange={(value) =>
                                setFieldValue('language', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                              <SelectContent>
                                {languageOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {touched.language && errors.language ? (
                              <div className="text-red-500 text-xs">
                                {String(errors.language)}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="website_url">Website URL *</Label>
                            <Input
                              id="website_url"
                              {...getFieldProps('website_url')}
                              placeholder="https://example.com"
                            />
                            {touched.website_url && errors.website_url ? (
                              <div className="text-red-500 text-xs">
                                {String(errors.website_url)}
                              </div>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <Label>Location *</Label>
                            <AsyncPaginate
                              value={values.location}
                              onChange={(newValue) =>
                                setFieldValue('location', newValue)
                              }
                              loadOptions={(
                                search: string,
                                _: OptionsOrGroups<any, GroupBase<any>>,
                                additional?: { page: number }
                              ) =>
                                locationService.getLocations(
                                  additional?.page || 1,
                                  search
                                )
                              }
                              additional={{ page: 1 }}
                              isMulti
                              placeholder="Search for locations..."
                              className="text-sm"
                            />
                            {touched.location && errors.location ? (
                              <div className="text-red-500 text-xs">
                                {String(errors.location)}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Team Assignment section removed for single-user application */}

                    {/* Competitors */}
                    <Card className="hover-lift">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe2 className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                          Competitor Websites
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FieldArray
                          name="competitors_websites"
                          render={(arrayHelpers) => (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Input
                                  value={newCompetitor}
                                  onChange={(e) =>
                                    setNewCompetitor(e.target.value)
                                  }
                                  placeholder="https://competitor.com"
                                  className="flex-1"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (newCompetitor.trim()) {
                                        arrayHelpers.push(newCompetitor.trim());
                                        setNewCompetitor('');
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (newCompetitor.trim()) {
                                      arrayHelpers.push(newCompetitor.trim());
                                      setNewCompetitor('');
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              {values.competitors_websites.map(
                                (competitor: string, index: number) => (
                                  <div
                                    key={`competitor-${competitor}-${index}`}
                                    className="flex items-center gap-2"
                                  >
                                    <Input
                                      value={competitor}
                                      onChange={(e) =>
                                        arrayHelpers.replace(
                                          index,
                                          e.target.value
                                        )
                                      }
                                      placeholder="https://competitor.com"
                                      className="flex-1"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => arrayHelpers.remove(index)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Target Keywords (Read-only) */}
                    <Card className="hover-lift">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                          Keywords & SEO
                          <Badge variant="secondary" className="text-xs">
                            Read-only
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-3">
                            Target keywords cannot be edited after project
                            creation. You can manage keywords from the project
                            overview page.
                          </p>
                          {targetedKeywords.length > 0 ? (
                            <div className="space-y-2">
                              {targetedKeywords.map((keyword, index) => (
                                <div
                                  key={`targeted-keyword-${keyword.keyword}-${index}`}
                                  className="flex items-center justify-between p-3 bg-background rounded-lg border"
                                >
                                  <div className="flex items-center gap-3">
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {keyword.keyword}
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {promptTypes.find(
                                      (pt) => pt._id === keyword.promptTypeId
                                    )?.name || 'Unknown Type'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              <Target className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                              <p>No target keywords found</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Content Guidelines */}
                    <Card className="hover-lift">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                          Content Guidelines *
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="guideline_id">
                            Industry Guideline Selection *
                          </Label>
                          <Select
                            value={values.guideline_id}
                            onValueChange={(value) =>
                              setFieldValue('guideline_id', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a guideline" />
                            </SelectTrigger>
                            <SelectContent>
                              {guidelines.map((guideline) => (
                                <SelectItem
                                  key={guideline._id}
                                  value={guideline._id}
                                >
                                  {guideline.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {touched.guideline_id && errors.guideline_id ? (
                            <div className="text-red-500 text-xs">
                              {String(errors.guideline_id)}
                            </div>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="guideline_description">
                              Project-Specific Guidelines
                            </Label>
                            <span
                              className="text-xs text-[hsl(var(--razor-primary))] cursor-pointer"
                              onClick={() =>
                                document
                                  .getElementById('guideline-import-file')
                                  ?.click()
                              }
                            >
                              Import DOCX/PDF
                            </span>
                          </div>
                          {/* Import DOCX/PDF Button */}
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="file"
                              accept=".pdf,.docx"
                              id="guideline-import-file"
                              style={{ display: 'none' }}
                              onChange={createFileImportHandler(
                                (text) =>
                                  setFieldValue('guideline_description', text),
                                () =>
                                  toast({
                                    title: 'Error',
                                    description: 'Failed to extract document.',
                                    variant: 'destructive',
                                  })
                              )}
                            />
                          </div>
                          <div data-color-mode="light">
                            <MDEditor
                              value={values.guideline_description}
                              onChange={(value) =>
                                setFieldValue(
                                  'guideline_description',
                                  value || ''
                                )
                              }
                              height={200}
                              preview="edit"
                            />
                          </div>
                          {touched.guideline_description &&
                          errors.guideline_description ? (
                            <div className="text-red-500 text-xs">
                              {String(errors.guideline_description)}
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI-Powered Fields */}
                    <Card className="hover-lift">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-[hsl(var(--razor-primary))]" />
                            Business Description
                          </CardTitle>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateWithAI}
                            disabled={isGenerating}
                          >
                            {isGenerating ? (
                              'Generating...'
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-1" /> Generate
                                with AI
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Target Audience *</Label>
                          <FieldArray
                            name="targeted_audience"
                            render={(arrayHelpers) => (
                              <div className="space-y-3">
                                <div className="flex gap-2">
                                  <Input
                                    value={newAudience}
                                    onChange={(e) =>
                                      setNewAudience(e.target.value)
                                    }
                                    placeholder="e.g., Small business owners"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (newAudience.trim()) {
                                          arrayHelpers.push(newAudience.trim());
                                          setNewAudience('');
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      if (newAudience.trim()) {
                                        arrayHelpers.push(newAudience.trim());
                                        setNewAudience('');
                                      }
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                {values.targeted_audience?.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {values.targeted_audience.map(
                                      (audience: string, index: number) => (
                                        <Badge
                                          key={`targeted-audience-${audience}-${index}`}
                                          variant="secondary"
                                          className="flex items-center gap-1"
                                        >
                                          {audience}
                                          <button
                                            type="button"
                                            onClick={() =>
                                              arrayHelpers.remove(index)
                                            }
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </Badge>
                                      )
                                    )}
                                  </div>
                                )}
                                {((Array.isArray(touched.targeted_audience) &&
                                  touched.targeted_audience.length > 0) ||
                                  hasSubmitted) &&
                                errors.targeted_audience ? (
                                  <div className="text-red-500 text-xs">
                                    {String(errors.targeted_audience)}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          />
                          {/* Author Bio Field - above Business Description */}
                          <div className="space-y-2">
                            <Label htmlFor="author_bio">Author Bio</Label>
                            <Textarea
                              id="author_bio"
                              {...getFieldProps('author_bio')}
                              placeholder="Enter author bio"
                              className="min-h-[80px]"
                            />
                            {touched.author_bio && errors.author_bio ? (
                              <div className="text-red-500 text-xs">
                                {String(errors.author_bio)}
                              </div>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="description">
                              Business Description *
                            </Label>
                            <div data-color-mode="light">
                              <MDEditor
                                value={values.description}
                                onChange={(value) =>
                                  setFieldValue('description', value || '')
                                }
                                height={200}
                                preview="edit"
                                id="description"
                              />
                            </div>
                            {touched.description && errors.description ? (
                              <div className="text-red-500 text-xs">
                                {String(errors.description)}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Additional Organization Insights - now a separate card */}
                    <Card className="hover-lift">
                      <CardHeader>
                        <CardTitle>Additional Organization Insights</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="organization_archetype">
                            Which archetype best describes your organization?
                          </Label>
                          <Textarea
                            id="organization_archetype"
                            {...getFieldProps('organization_archetype')}
                            placeholder="e.g., Innovator, Caregiver, Explorer, etc."
                            className="min-h-[80px]"
                          />
                          {touched.organization_archetype &&
                          errors.organization_archetype ? (
                            <div className="text-red-500 text-xs">
                              {String(errors.organization_archetype)}
                            </div>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="brand_spokesperson">
                            If you could choose a famous person (real or
                            fictional) to be the spokesperson for your brand,
                            who would it be?
                          </Label>
                          <Textarea
                            id="brand_spokesperson"
                            {...getFieldProps('brand_spokesperson')}
                            placeholder="e.g., Tony Stark, Oprah Winfrey, etc."
                            className="min-h-[80px]"
                          />
                          {touched.brand_spokesperson &&
                          errors.brand_spokesperson ? (
                            <div className="text-red-500 text-xs">
                              {String(errors.brand_spokesperson)}
                            </div>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="most_important_thing">
                            What is the MOST IMPORTANT thing to you (as an
                            organization)?
                          </Label>
                          <Textarea
                            id="most_important_thing"
                            {...getFieldProps('most_important_thing')}
                            placeholder="e.g., Customer satisfaction, Innovation, etc."
                            className="min-h-[80px]"
                          />
                          {touched.most_important_thing &&
                          errors.most_important_thing ? (
                            <div className="text-red-500 text-xs">
                              {String(errors.most_important_thing)}
                            </div>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="unique_differentiator">
                            What is the one thing that sets you apart from all
                            your competitors?
                          </Label>
                          <Textarea
                            id="unique_differentiator"
                            {...getFieldProps('unique_differentiator')}
                            placeholder="e.g., Fastest delivery, Unique technology, etc."
                            className="min-h-[80px]"
                          />
                          {touched.unique_differentiator &&
                          errors.unique_differentiator ? (
                            <div className="text-red-500 text-xs">
                              {String(errors.unique_differentiator)}
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2 mt-8 mb-12">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(`/projects/${projectId}`)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[hsl(var(--razor-primary))] text-white"
                      >
                        {isSubmitting ? 'Updating...' : 'Update Project'}
                      </Button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </CardContent>
        </div>
      </main>
    </div>
  );
}
