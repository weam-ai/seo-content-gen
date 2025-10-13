import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sparkles,
  Building,
  ArrowLeft,
} from 'lucide-react';
import { languageOptions } from '@/lib/mock-data'; // Assuming languageOptions are still used
// Removed UserService and TeamMember for single-user application
import MDEditor from '@uiw/react-md-editor';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import AsyncSelect from '@/components/ui/async-select';
import locationService from '@/lib/services/location.service';
// Removed ManageTeamAssignmentModal for single-user application
import CsvKeywordTypeModal from '@/components/ui/CsvKeywordTypeModal';
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
  competitors_websites: Yup.array().of(
    Yup.string().url('Each competitor must be a valid URL')
  ),
  targeted_keywords: Yup.array()
    .of(
      Yup.object().shape({
        keyword: Yup.string().required('Keyword is required'),
        promptTypeId: Yup.string().required('Article type is required'),
      })
    )
    .min(1, 'At least one targeted keyword is required')
    .required('Targeted keywords are required'),
  guideline_id: Yup.string().required('An industry guideline must be selected'),
  guideline_description: Yup.string(),
  targeted_audience: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one target audience is required')
    .required('Targeted audience is required'),
  author_bio: Yup.string(),
  organization_archetype: Yup.string(),
  brand_spokesperson: Yup.string(),
  most_important_thing: Yup.string(),
  unique_differentiator: Yup.string(),
});

export default function NewProject() {
  const navigate = useNavigate();
  const [promptTypes, setPromptTypes] = useState<PromptType[]>([]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  // Removed teamMembers state for single-user application
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newKeyword, setNewKeyword] = useState<KeywordInput>({
    keyword: '',
    promptTypeId: '',
  });
  const [newAudience, setNewAudience] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const websiteUrlRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<any>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvKeywords, setCsvKeywords] = useState<string[]>([]);
  const [csvKeywordTypes, setCsvKeywordTypes] = useState<{
    [k: string]: string;
  }>({});
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const initialValues = {
    name: '',
    description: '',
    competitors_websites: [] as string[],
    targeted_keywords: [] as KeywordInput[],
    website_url: '',
    language: '',
    location: [] as { value: string; label: string }[],
    guideline_id: '',
    guideline_description: '',
    targeted_audience: [] as string[],
    topic_titles: '',
    sitemapdata: '',
    detailedsitemap: '',
    author_bio: '',
    organization_archetype: '',
    brand_spokesperson: '',
    most_important_thing: '',
    unique_differentiator: '',
  };

  useEffect(() => {
    const fetchPromptTypes = async () => {
      try {
        const response = await PromptTypeService.getAllPromptTypes();
        if (response.status) {
          setPromptTypes(response.data);
          if (response.data.length > 0) {
            setNewKeyword((prev) => ({
              ...prev,
              promptTypeId: response.data[0]._id,
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch prompt types', error);
      }
    };
    fetchPromptTypes();
  }, []);

  useEffect(() => {
    const fetchGuidelines = async () => {
      try {
        const response = await GuidelineService.getGuidelines();
        if (response.status) {
          setGuidelines(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch guidelines', error);
      }
    };
    fetchGuidelines();
  }, []);

  // Removed fetchTeamMembers useEffect for single-user application

  return (
    <div className="">
      {/* Back Button - Positioned below the logo */}
      <div className="container mx-auto md:px-4 px-2 md:py-8 py-4">
        <Button
          variant="ghost"
          className="gap-2 mb-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Main Content */}
      <main className="container mx-auto md:px-4 px-2 md:py-8 py-4">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Create New Project"
            description="Set up your content writing project with AI-powered insights"
          />
          <CardContent className="py-8 px-0">
            <Formik
              innerRef={formRef}
              initialValues={initialValues}
              validationSchema={validationSchema}
              validateOnChange={hasSubmitted}
              validateOnBlur={hasSubmitted}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  // Transform locations to string array before submitting
                  const payload = {
                    name: values.name,
                    description: `${values.description || ''}`.trim(),
                    competitors_websites: values.competitors_websites,
                    targeted_keywords: values.targeted_keywords,
                    website_url: values.website_url,
                    language: values.language,
                    guideline_id: values.guideline_id,
                    guideline_description: values.guideline_description,
                    topic_titles: values.topic_titles,
                    sitemapdata: values.sitemapdata,
                    detailedsitemap: values.detailedsitemap,
                    location: values.location.map((loc) => loc.label),
                    targeted_audience: (values.targeted_audience || []).join(
                      ', '
                    ),
                    author_bio: values.author_bio,
                    organization_archetype: values.organization_archetype,
                    brand_spokesperson: values.brand_spokesperson,
                    most_important_thing: values.most_important_thing,
                    unique_differentiator: values.unique_differentiator,
                  };

                  const response = await ProjectService.createProject(payload);

                  if (response.status) {
                    toast({
                      title: 'Success',
                      description: 'Project created successfully!',
                    });
                    navigate(`/projects/${response.data._id}`);
                  } else {
                    toast({
                      title: 'Error',
                      description:
                        response.message || 'Failed to create project.',
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
              }}
            >
              {({
                values,
                errors,
                touched,
                isSubmitting,
                getFieldProps,
                setFieldValue,
                setFieldTouched,
                setTouched,
                validateForm,
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
                      const { company_details, owner_bio, target_audience } =
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
                  <Form className="space-y-8" onSubmit={handleCustomSubmit}>
                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-800" />
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
                                {errors.name}
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
                              onOpenChange={(isOpen) => {
                                if (!isOpen) {
                                  setFieldTouched('language', true);
                                }
                              }}
                            >
                              <SelectTrigger id="language">
                                <SelectValue placeholder="Select a language" />
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
                                {errors.language}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="website_url">Website URL *</Label>
                            <Input
                              id="website_url"
                              ref={websiteUrlRef}
                              {...getFieldProps('website_url')}
                              placeholder="https://example.com"
                            />
                            {touched.website_url && errors.website_url ? (
                              <div className="text-red-500 text-xs">
                                {errors.website_url}
                              </div>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location *</Label>
                            <AsyncSelect
                              id="location"
                              name="location"
                              isMulti
                              value={values.location}
                              loadOptions={async (search, _, additional) => {
                                const page = additional?.page || 1;
                                const { options, hasMore } =
                                  await locationService.getLocations(
                                    page,
                                    search
                                  );
                                return {
                                  options,
                                  hasMore,
                                  additional: {
                                    page: page + 1,
                                  },
                                };
                              }}
                              onChange={(value) =>
                                setFieldValue('location', value)
                              }
                              onBlur={() => setFieldTouched('location', true)}
                              placeholder="Select locations"
                              additional={{
                                page: 1,
                              }}
                            />
                            {touched.location && errors.location ? (
                              <div className="text-red-500 text-xs">
                                {typeof errors.location === 'string'
                                  ? errors.location
                                  : 'Location is required.'}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Team Assignment section removed for single-user application */}

                    {/* Website & Competition */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-gray-800" />
                          Competitor Websites
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <FieldArray
                          name="competitors_websites"
                          render={(arrayHelpers) => (
                            <div className="space-y-2">
                              <Label>Competitor Websites</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={newCompetitor}
                                  onChange={(e) =>
                                    setNewCompetitor(e.target.value)
                                  }
                                  placeholder="https://competitor.com"
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
                              <div className="flex flex-wrap gap-2 mt-2">
                                {values.competitors_websites?.map(
                                  (site, index) => (
                                    <Badge
                                      key={`competitor-site-${site}-${index}`}
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                    >
                                      {site}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          arrayHelpers.remove(index)
                                        }
                                        id={`competitors_websites-remove-${index}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        />
                      </CardContent>
                    </Card>

                    {/* Targeted Keywords */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-gray-800" />
                          Keywords & SEO
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="guideline_id">
                              Targeted Keywords *
                            </Label>
                            <span
                              className="text-xs text-gray-800 cursor-pointer underline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Import CSV
                            </span>
                          </div>
                          <FieldArray
                            name="targeted_keywords"
                            render={(arrayHelpers) => (
                              <div>
                                <div className="flex gap-2 items-center mb-2">
                                  <input
                                    type="file"
                                    accept=".csv"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
                                      setCsvError(null);
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const text = event.target
                                          ?.result as string;
                                        if (!text) {
                                          setCsvError('Empty file.');
                                          return;
                                        }
                                        // Parse CSV: support both horizontal and vertical
                                        let keywords: string[] = [];
                                        const lines = text
                                          .split(/\r?\n/)
                                          .map((l) => l.trim())
                                          .filter(Boolean);
                                        for (const line of lines) {
                                          const cells = line
                                            .split(',')
                                            .map((cell) => cell.trim())
                                            .filter(Boolean);
                                          if (cells.length > 1) {
                                            keywords.push(...cells);
                                          } else if (cells.length === 1) {
                                            keywords.push(cells[0]);
                                          }
                                        }
                                        // Remove duplicates and empty
                                        keywords = Array.from(
                                          new Set(
                                            keywords
                                              .map((k) => k.trim())
                                              .filter(Boolean)
                                          )
                                        );
                                        if (keywords.length === 0) {
                                          setCsvError(
                                            'No keywords found in CSV.'
                                          );
                                          return;
                                        }
                                        setCsvKeywords(keywords);
                                        setCsvKeywordTypes(
                                          Object.fromEntries(
                                            keywords.map((k) => [
                                              k,
                                              promptTypes[0]?._id || '',
                                            ])
                                          )
                                        );
                                        setCsvModalOpen(true);
                                      };
                                      reader.readAsText(file);
                                      e.target.value = '';
                                    }}
                                  />
                                  {csvError && (
                                    <span className="text-red-500 text-xs ml-2">
                                      {csvError}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    value={newKeyword.keyword}
                                    onChange={(e) =>
                                      setNewKeyword((prev) => ({
                                        ...prev,
                                        keyword: e.target.value,
                                      }))
                                    }
                                    placeholder="Enter a keyword"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        if (
                                          newKeyword.keyword.trim() &&
                                          newKeyword.promptTypeId
                                        ) {
                                          arrayHelpers.push(newKeyword);
                                          setNewKeyword({
                                            keyword: '',
                                            promptTypeId:
                                              promptTypes.length > 0
                                                ? promptTypes[0]._id
                                                : '',
                                          });
                                        }
                                      }
                                    }}
                                    id="targeted_keywords"
                                  />
                                  <Select
                                    value={newKeyword.promptTypeId}
                                    onValueChange={(value) =>
                                      setNewKeyword((prev) => ({
                                        ...prev,
                                        promptTypeId: value,
                                      }))
                                    }
                                    disabled={promptTypes.length === 0}
                                  >
                                    <SelectTrigger
                                      className="w-48"
                                      id="promptTypeId"
                                    >
                                      <SelectValue placeholder="Select article type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {promptTypes.map((type) => (
                                        <SelectItem
                                          key={type._id}
                                          value={type._id}
                                        >
                                          {type.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        newKeyword.keyword.trim() &&
                                        newKeyword.promptTypeId
                                      ) {
                                        arrayHelpers.push(newKeyword);
                                        setNewKeyword({
                                          keyword: '',
                                          promptTypeId:
                                            promptTypes.length > 0
                                              ? promptTypes[0]._id
                                              : '',
                                        });
                                      }
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                {touched.targeted_keywords &&
                                typeof errors.targeted_keywords === 'string' ? (
                                  <div className="text-red-500 text-xs mt-2">
                                    {errors.targeted_keywords}
                                  </div>
                                ) : null}
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {values.targeted_keywords.map((kw, index) => (
                                    <Badge
                                      key={`targeted-keyword-${kw.keyword}-${index}`}
                                      variant="secondary"
                                      className="flex items-center gap-2"
                                      id={`targeted_keywords-${index}`}
                                    >
                                      <span>{kw.keyword}</span>
                                      <span className="text-xs text-muted-foreground">
                                        (
                                        {promptTypes.find(
                                          (pt) => pt._id === kw.promptTypeId
                                        )?.name || '...'}
                                        )
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          arrayHelpers.remove(index)
                                        }
                                        id={`targeted_keywords-remove-${index}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Content Guidelines */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-gray-800" />
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
                            <SelectTrigger id="guideline_id">
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
                              {errors.guideline_id}
                            </div>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="guideline_description">
                              Project-Specific Guidelines
                            </Label>
                            <span
                              className="text-xs text-gray-800 cursor-pointer underline"
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
                                () => {
                                  toast({
                                    title: 'Error',
                                    description: `Error in uploading file`,
                                  });
                                }
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
                              id="guideline_description"
                            />
                          </div>
                          {touched.guideline_description &&
                          errors.guideline_description ? (
                            <div className="text-red-500 text-xs">
                              {errors.guideline_description}
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI-Powered Fields */}
                    <Card>
                      <CardHeader>
                        <div className="flex md:items-center justify-between flex-col md:flex-row gap-y-2 md:gap-y-0">
                          <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5 text-gray-800" />
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
                        <FieldArray
                          name="targeted_audience"
                          render={(arrayHelpers) => (
                            <div className="space-y-2">
                              <Label>Targeted Audience *</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={newAudience}
                                  onChange={(e) =>
                                    setNewAudience(e.target.value)
                                  }
                                  placeholder="Add an audience segment"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (newAudience.trim()) {
                                        arrayHelpers.push(newAudience.trim());
                                        setNewAudience('');
                                      }
                                    }
                                  }}
                                  id="new-audience"
                                />
                                <Button
                                  type="button"
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
                              {touched.targeted_audience &&
                              typeof errors.targeted_audience === 'string' ? (
                                <div className="text-red-500 text-xs mt-1">
                                  {errors.targeted_audience}
                                </div>
                              ) : null}
                              <div className="flex flex-wrap gap-2 mt-2">
                                {values.targeted_audience.map(
                                  (audience, index) => (
                                    <Badge
                                      key={`targeted-audience-${audience}-${index}`}
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                      id={`targeted_audience-${index}`}
                                    >
                                      {audience}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          arrayHelpers.remove(index)
                                        }
                                        id={`targeted_audience-remove-${index}`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        />
                        {/* Author Bio Field - moved above Business Description */}
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
                              {errors.author_bio}
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
                              {errors.description}
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Add 4 new fields at the bottom, above the submit/cancel buttons */}
                    <Card className="mt-6">
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
                              {errors.organization_archetype}
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
                              {errors.brand_spokesperson}
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
                              {errors.most_important_thing}
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
                              {errors.unique_differentiator}
                            </div>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2 mt-8 mb-12">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/projects')}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className=""
                      >
                        {isSubmitting ? 'Creating...' : 'Create Project'}
                      </Button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </CardContent>
        </div>
      </main>
      <CsvKeywordTypeModal
        open={csvModalOpen}
        onOpenChange={setCsvModalOpen}
        keywords={csvKeywords}
        setKeywords={setCsvKeywords}
        keywordTypes={csvKeywordTypes}
        setKeywordTypes={setCsvKeywordTypes}
        promptTypes={promptTypes}
        error={csvError}
        setError={setCsvError}
        onApply={() => {
          // Validate all keywords have article type selected
          const missing = csvKeywords.filter((k) => !csvKeywordTypes[k]);
          if (missing.length > 0) {
            setCsvError('Please select article type for all keywords.');
            return;
          }

          // Get current form values using formRef
          const currentValues = formRef.current?.values;
          if (!currentValues) {
            setCsvError('Form not available. Please try again.');
            return;
          }

          // Create new keyword pairs from CSV
          const newPairs = csvKeywords.map((k) => ({
            keyword: k,
            promptTypeId: csvKeywordTypes[k],
          }));

          // Get existing keywords to prevent duplicates
          const existingKeywords = (currentValues.targeted_keywords || []).map(
            (k: KeywordInput) => k.keyword
          );

          // Filter out duplicates
          const filteredPairs = newPairs.filter(
            (pair) => !existingKeywords.includes(pair.keyword)
          );

          if (filteredPairs.length === 0) {
            setCsvError('All keywords already exist in the form.');
            return;
          }

          // Update form values
          const updatedKeywords = [
            ...(currentValues.targeted_keywords || []),
            ...filteredPairs,
          ];
          formRef.current?.setFieldValue('targeted_keywords', updatedKeywords);

          // Close modal and reset state
          setCsvModalOpen(false);
          setCsvKeywords([]);
          setCsvKeywordTypes({});
          setCsvError(null);

          // Show success message
          toast({
            title: 'Success',
            description: `${filteredPairs.length} keyword(s) added successfully!`,
          });
        }}
        onCancel={() => {
          setCsvModalOpen(false);
          setCsvKeywords([]);
          setCsvKeywordTypes({});
          setCsvError(null);
        }}
      />
    </div>
  );
}
 