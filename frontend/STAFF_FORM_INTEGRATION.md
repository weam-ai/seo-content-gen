# Staff Member Form Integration

This document explains how to use the updated Staff Member Form with the integrated API response structure.

## Features

✅ **Fixed TypeScript errors** - Proper typing for form data and state management
✅ **API Integration** - Integrated with the `/users/:userId` GET endpoint
✅ **Edit Mode Support** - Automatically loads user data when editing
✅ **Conditional Password Fields** - Password fields only shown in add mode
✅ **Proper Data Mapping** - Maps API response to form fields correctly
✅ **Location Selection** - Country/State/City dropdowns with proper dependencies
✅ **Form Validation** - Different validation rules for add vs edit mode

## API Response Structure

The form now properly handles the API response structure:

```json
{
  "status": true,
  "message": "User information fetched successfully",
  "data": {
    "id": "668e59c6-a64a-4ac0-904e-8aab9262de51",
    "firstname": "Aayush",
    "lastname": "Solanki",
    "email": "aayush.solanki@e2m.solutions",
    "phonenumber": "9900990099",
    "dob": "2001-11-01",
    "gender": "male",
    "is_wfh": false,
    "date_of_joining": "2025-03-05",
    "calendly_url": "https://test.com/",
    "email_signature": "Regards,\n\nAayush Solanki",
    "country": "IN",
    "state": "GJ", 
    "city": "Ahmedabad",
    "role": {
      "id": "e94c1b8f-a051-4bd0-acad-6da57216a169",
      "name": "Admin"
    },
    "designation": {
      "id": "bd1718b1-f69b-442a-a8c5-860161254dfa",
      "name": "Dev Head"
    }
  }
}
```

## Usage

### Add New Staff Member
```tsx
import AddStaffMember from '@/pages/setup/users/new-staff';

function MyComponent() {
  return <AddStaffMember />;
}
```

### Edit Existing Staff Member
```tsx
import { EditStaffMember } from '@/pages/setup/users/new-staff';

function MyComponent() {
  const handleSave = () => {
    // Optional callback after successful save
    console.log('Staff member updated!');
  };

  return (
    <EditStaffMember 
      userId="668e59c6-a64a-4ac0-904e-8aab9262de51" 
      onSave={handleSave}
    />
  );
}
```

### Using the Form Component Directly
```tsx
import { StaffMemberForm } from '@/pages/setup/users/new-staff';

function MyComponent() {
  return (
    <StaffMemberForm 
      mode="edit" 
      initialData={{ id: "user-id-here" }}
      onSave={() => console.log('Saved!')}
    />
  );
}
```

## Key Changes Made

1. **Type Safety**: Added proper TypeScript interfaces for form data
2. **API Integration**: Added `getUserDetails` method to user service
3. **Data Mapping**: Helper functions to map API response to form fields
4. **Conditional Rendering**: Password fields only show in add mode
5. **Improved Validation**: Different validation rules for add vs edit
6. **Error Handling**: Proper error handling for API calls
7. **Date Formatting**: Proper date formatting for form inputs

## Form Fields Mapping

| Form Field | API Field | Notes |
|------------|-----------|-------|
| firstName | firstname | Direct mapping |
| lastName | lastname | Direct mapping |
| email | email | Direct mapping |
| phone | phonenumber | Direct mapping |
| country | country | Direct mapping |
| state | state | Direct mapping |
| city | city | Direct mapping |
| designation | designation.name | Mapped from nested object |
| role | role.name | Mapped from nested object |
| dateOfBirth | dob | Formatted for input field |
| dateOfJoining | date_of_joining | Formatted for input field |
| gender | gender | Direct mapping |
| calendlyUrl | calendly_url | Direct mapping |
| workFromHome | is_wfh | Mapped: true→"yes", false→"no" |
| emailSignature | email_signature | Direct mapping |

## Validation Rules

### Add Mode
- First Name: Required
- Last Name: Required  
- Email: Required
- Password: Required
- Confirm Password: Required and must match password

### Edit Mode
- First Name: Required
- Last Name: Required
- Email: Required
- Password: Not required (hidden)

## Error Handling

The form includes comprehensive error handling for:
- API call failures
- Invalid designation/role selection
- Network errors
- Form validation errors

All errors are displayed using the toast notification system.
