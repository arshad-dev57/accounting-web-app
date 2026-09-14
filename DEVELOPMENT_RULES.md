# Bisonstechs ERP - Development Rules

## Mandatory AI Startup Procedure

Every new AI agent working on this repository must:

1. **Read AI_CONTEXT.md** - Understand the complete project architecture, business rules, and integration points
2. **Read PROJECT_STATUS.md** - Understand the current implementation status and pending work
3. **Read DEVELOPMENT_RULES.md** - Review these development rules and guidelines
4. **Read CHANGELOG.md** - Understand the project history and recent changes
5. **Read AI_TASKS.md** - Review the current task list and priorities
6. **Inspect Git status** - Check for uncommitted changes and current branch
7. **Inspect recent Git commits** - Understand recent development activity
8. **Inspect the relevant existing code** - Thoroughly examine existing implementations before making changes
9. **Understand the current implementation** - Ensure complete understanding of the current state
10. **Only then start the requested task** - Begin implementation only after full context understanding

## Mandatory AI Completion Procedure

After completing significant work, every AI agent must:

1. **Verify the implementation** - Test the changes thoroughly
2. **Run relevant tests/checks** - Ensure no regressions in existing functionality
3. **Review git diff** - Check all changes before committing
4. **Update PROJECT_STATUS.md** - Reflect the new implementation status
5. **Add the completed work to CHANGELOG.md** - Document the changes with proper format
6. **Update AI_TASKS.md** - Mark completed tasks and add new tasks if needed
7. **Update AI_CONTEXT.md only if architecture/business rules/important decisions changed** - Update context only for significant changes
8. **Clearly report what was changed and what remains pending** - Provide comprehensive completion report

## Core Development Principles

### 1. Always Inspect Existing Code Before Changing It
- **Rule**: Never modify code without first understanding the existing implementation
- **Action**: Read relevant files, understand patterns, identify dependencies
- **Reason**: Prevent breaking existing functionality and maintain consistency

### 2. Never Rebuild Existing Features Unnecessarily
- **Rule**: Reuse existing components, services, and patterns
- **Action**: Search for existing implementations before creating new ones
- **Reason**: Maintain consistency and reduce technical debt

### 3. Never Modify Unrelated Modules
- **Rule**: Only modify files directly related to the task
- **Action**: Scope changes to the specific module or feature
- **Reason**: Prevent unintended side effects and regressions

### 4. Preserve Existing Business Logic
- **Rule**: Do not change business logic without explicit requirement
- **Action**: Maintain existing formulas, calculations, and workflows
- **Reason**: Business logic is critical for system integrity

### 5. Preserve Existing UI Unless Specifically Required
- **Rule**: Do not modify UI components for non-UI tasks
- **Action**: Keep UI changes minimal and focused on requirements
- **Reason**: Maintain user experience consistency

### 6. Follow Existing Architecture and Naming Conventions
- **Rule**: Use existing patterns for file structure, naming, and organization
- **Action**: Follow established conventions for files, variables, functions
- **Reason**: Maintain code consistency and readability

### 7. Reuse Existing Services/Components/Controllers/Models
- **Rule**: Leverage existing infrastructure before creating new
- **Action**: Use existing services, components, controllers, models
- **Reason**: Reduce duplication and maintain consistency

### 8. Check Database Relationships Before Modifying Prisma/Database Models
- **Rule**: Understand all relationships before schema changes
- **Action**: Review foreign keys, cascading rules, and data dependencies
- **Reason**: Prevent data integrity issues and migration problems

### 9. Check API Consumers Before Changing API Contracts
- **Rule**: Understand who uses an API before changing it
- **Action**: Review frontend services, other backend endpoints
- **Reason**: Prevent breaking API contracts and causing integration issues

### 10. Do Not Delete Existing Functionality Without Explicit Approval
- **Rule**: Never remove features or code without approval
- **Action**: Deprecate instead of delete, get approval for removals
- **Reason**: Preserve functionality and prevent data loss

### 11. Do Not Expose Secrets in Documentation
- **Rule**: Never include API keys, passwords, tokens in documentation
- **Action**: Use placeholders and environment variable references
- **Reason**: Maintain security and prevent credential exposure

### 12. Run Appropriate Tests/Checks After Changes
- **Rule**: Verify changes don't break existing functionality
- **Action**: Test related features, run available tests, check error logs
- **Reason**: Ensure quality and prevent regressions

### 13. Check Git Diff Before Finishing
- **Rule**: Review all changes before completing work
- **Action**: Use git diff to verify changes are correct and minimal
- **Reason**: Prevent unintended changes and ensure clean commits

### 14. Document Significant Changes in CHANGELOG.md
- **Rule**: Add entries for all significant changes
- **Action**: Follow the established changelog format with dates and details
- **Reason**: Maintain project history and enable tracking

### 15. Update PROJECT_STATUS.md After Significant Work
- **Rule**: Reflect implementation status changes
- **Action**: Update completion status, add new items if needed
- **Reason**: Keep project status accurate for future development

### 16. Update AI_CONTEXT.md When Architecture/Business Rules/Important Decisions Change
- **Rule**: Update context only for significant architectural changes
- **Action**: Document new architectural decisions, business rule changes
- **Reason**: Keep context accurate for future AI agents

## Module-Specific Rules

### Accounting Module
- **Never modify double-entry bookkeeping logic** without explicit approval
- **Preserve fiscal year protection mechanisms**
- **Maintain chart of account hierarchy integrity**
- **Do not change tax calculation logic** without understanding tax rules
- **Preserve journal entry generation logic** for integrated modules

### Inventory/Warehouse Module
- **Never bypass location-based stock tracking**
- **Preserve stock movement audit trail**
- **Maintain product-category relationships**
- **Do not modify stock valuation methods** without approval
- **Preserve supplier-customer relationships**

### Sales Module
- **Maintain sales-to-accounting integration**
- **Preserve quotation-to-order workflow**
- **Do not modify delivery logic** without understanding logistics
- **Maintain customer balance tracking**
- **Preserve sales reporting logic**

### Purchases Module
- **Maintain purchase-to-accounting integration**
- **Preserve purchase order workflow**
- **Do not modify goods receiving logic** without approval
- **Maintain supplier balance tracking**
- **Preserve purchase reporting logic**

### POS Module
- **Never modify offline sync logic** without understanding sync architecture
- **Preserve bidirectional sync mechanism**
- **Maintain terminal-shift relationships**
- **Do not modify restaurant mode logic** without approval
- **Preserve POS-to-accounting integration**

### HR Module
- **Preserve employee-user relationships**
- **Maintain geofencing validation logic**
- **Do not modify payroll calculations** without approval
- **Preserve attendance tracking accuracy**
- **Maintain leave balance calculations**

### Manufacturing Module (Future)
- **Follow existing integration patterns** with Inventory, Accounting, HR
- **Preserve BOM versioning logic**
- **Maintain material reservation accuracy**
- **Do not modify cost calculation logic** without approval
- **Preserve production order workflow integrity**

## Database Development Rules

### Schema Changes
- **Always create migration files** for schema changes
- **Test migrations on development database first**
- **Never modify existing migrations** - create new ones
- **Use descriptive migration names** with timestamps
- **Consider data preservation** in migration design

### Prisma Schema
- **Follow existing naming conventions** (snake_case for database fields)
- **Maintain proper foreign key relationships**
- **Add appropriate indexes** for performance
- **Use proper data types** for fields
- **Maintain referential integrity** with proper relations

### Database Operations
- **Use transactions** for multi-table operations
- **Handle errors properly** with rollback
- **Consider performance** for large datasets
- **Use proper includes** for related data
- **Implement proper pagination** for list queries

## API Development Rules

### Route Design
- **Follow RESTful conventions** for API design
- **Use consistent naming** for endpoints
- **Implement proper HTTP methods** (GET, POST, PUT, DELETE)
- **Use proper status codes** for responses
- **Maintain consistent response format**

### Authentication/Authorization
- **Always apply authentication middleware** to protected routes
- **Use proper authorization checks** for sensitive operations
- **Never bypass security checks** for convenience
- **Implement proper error handling** for auth failures
- **Maintain session security** with proper token management

### Error Handling
- **Use consistent error response format**
- **Provide meaningful error messages**
- **Log errors appropriately** for debugging
- **Handle edge cases gracefully**
- **Never expose sensitive information** in errors

### Validation
- **Validate all input data** before processing
- **Use consistent validation patterns**
- **Provide clear validation error messages**
- **Sanitize user input** to prevent injection attacks
- **Validate business rules** in addition to data validation

## Frontend Development Rules

### Component Design
- **Follow existing component patterns** and structure
- **Use existing UI components** before creating new ones
- **Maintain consistent styling** with Tailwind CSS
- **Implement proper error boundaries** for error handling
- **Use proper TypeScript types** for type safety

### State Management
- **Use existing context providers** where appropriate
- **Follow existing state management patterns**
- **Avoid unnecessary re-renders** with proper memoization
- **Maintain consistent data flow** patterns
- **Use proper loading states** for async operations

### Service Layer
- **Follow existing service patterns** for API calls
- **Reuse existing services** where possible
- **Implement proper error handling** in services
- **Use consistent naming** for service functions
- **Maintain proper TypeScript types**

### UI/UX
- **Follow existing design system** and patterns
- **Maintain consistent navigation** patterns
- **Use existing components** for common UI elements
- **Implement proper responsive design**
- **Follow accessibility best practices**

## Integration Rules

### Module Integration
- **Understand existing integration points** before creating new ones
- **Follow established integration patterns**
- **Maintain data consistency** across modules
- **Implement proper error handling** for integration failures
- **Test integration thoroughly** before deployment

### Database Integration
- **Understand foreign key relationships** before integration
- **Maintain referential integrity** across modules
- **Use proper transaction handling** for cross-module operations
- **Consider performance implications** of integration
- **Test data migration** for new integrations

### API Integration
- **Follow existing API integration patterns**
- **Maintain consistent error handling** across integrations
- **Use proper authentication** for cross-module API calls
- **Implement proper retry logic** for failed calls
- **Test API integration** thoroughly

## Testing Rules

### Unit Testing
- **Write unit tests** for business logic
- **Test edge cases** and error conditions
- **Maintain test coverage** for critical paths
- **Use consistent testing patterns**
- **Keep tests independent** and repeatable

### Integration Testing
- **Test module integrations** thoroughly
- **Test cross-module workflows** end-to-end
- **Mock external dependencies** appropriately
- **Test error scenarios** in integrations
- **Maintain integration test suite**

### Manual Testing
- **Test all user-facing changes** manually
- **Test on different browsers** and devices
- **Test with realistic data** scenarios
- **Test error scenarios** and edge cases
- **Document test procedures** for complex features

## Performance Rules

### Database Performance
- **Use proper indexes** for frequently queried fields
- **Optimize complex queries** with proper joins
- **Use pagination** for large datasets
- **Consider caching** for frequently accessed data
- **Monitor query performance** regularly

### API Performance
- **Implement proper response caching** where appropriate
- **Use pagination** for list endpoints
- **Optimize payload sizes** for API responses
- **Consider async processing** for long operations
- **Monitor API response times** regularly

### Frontend Performance
- **Implement proper code splitting** for large applications
- **Use lazy loading** for heavy components
- **Optimize images and assets**
- **Minimize re-renders** with proper React optimization
- **Monitor bundle size** and load times

## Security Rules

### Authentication
- **Never expose secrets** in client-side code
- **Use proper token storage** (httpOnly cookies preferred)
- **Implement proper token expiration**
- **Use secure authentication** methods
- **Never implement custom crypto** - use established libraries

### Authorization
- **Implement proper role-based access control**
- **Validate permissions** on every protected operation
- **Never rely on client-side authorization** alone
- **Implement proper resource-level access control**
- **Audit sensitive operations** for security monitoring

### Data Protection
- **Never log sensitive information** (passwords, tokens)
- **Sanitize user input** to prevent injection attacks
- **Use parameterized queries** to prevent SQL injection
- **Implement proper CORS configuration**
- **Use HTTPS** for all communications in production

### Validation
- **Validate all input data** on both client and server
- **Implement proper type checking** with TypeScript
- **Sanitize output** to prevent XSS attacks
- **Use Content Security Policy** headers
- **Implement rate limiting** to prevent abuse

## Git Workflow Rules

### Committing
- **Write descriptive commit messages** following established format
- **Commit frequently** with focused, logical changes
- **Never commit credentials** or sensitive data
- **Review changes** before committing with git diff
- **Follow branch strategy** for the project

### Branching
- **Create feature branches** for new work
- **Keep branches focused** on specific features
- **Merge regularly** with main branch to avoid conflicts
- **Delete merged branches** to keep repository clean
- **Use descriptive branch names**

### Code Review
- **Review changes carefully** before merging
- **Test changes** in a clean environment
- **Consider performance implications** of changes
- **Check for security vulnerabilities**
- **Ensure documentation** is updated if needed

## Documentation Rules

### Code Documentation
- **Add comments** for complex logic
- **Document business rules** in code where appropriate
- **Use descriptive variable and function names**
- **Maintain consistent documentation style**
- **Update documentation** when code changes

### Project Documentation
- **Update AI_CONTEXT.md** for architectural changes
- **Update PROJECT_STATUS.md** for implementation changes
- **Update CHANGELOG.md** for all significant changes
- **Update AI_TASKS.md** for task status changes
- **Keep documentation accurate** and up-to-date

### API Documentation
- **Document API endpoints** with clear descriptions
- **Include request/response examples**
- **Document error responses** and codes
- **Keep API documentation** synchronized with implementation
- **Consider using OpenAPI/Swagger** for API docs

## Communication Rules

### Clarification
- **Ask for clarification** when requirements are unclear
- **Confirm understanding** before starting implementation
- **Document assumptions** when making decisions
- **Communicate blockers** promptly
- **Provide regular updates** on progress

### Reporting
- **Report completion status** clearly and comprehensively
- **Highlight any issues** or concerns discovered
- **Suggest next steps** when appropriate
- **Document lessons learned** from the work
- **Provide accurate time estimates** when asked

## Environment-Specific Rules

### Development Environment
- **Use environment variables** for configuration
- **Never commit environment files** with secrets
- **Maintain consistent development** and production environments
- **Use proper database migrations** for schema changes
- **Test in development environment** before deployment

### Production Environment
- **Never deploy directly** to production without testing
- **Use proper deployment pipelines** with checks
- **Monitor production** after deployment for issues
- **Have rollback plan** ready for deployments
- **Document production configuration** appropriately

## Additional Rules Discovered from Project

### Multi-Tenancy Rules
- **Always include companyId** in queries for multi-tenant data
- **Never leak data** across companies
- **Validate company access** on every operation
- **Use proper company isolation** in all modules
- **Test multi-tenancy** thoroughly

### Location-Based Rules
- **Always respect location scoping** for user access
- **Validate location permissions** before operations
- **Maintain location-based data separation**
- **Use proper location filtering** in queries
- **Test location-based access** thoroughly

### Subscription Rules
- **Always check subscription status** for premium features
- **Enforce user and branch limits** based on subscription
- **Provide clear messaging** for subscription-related access denied
- **Never bypass subscription checks** for convenience
- **Test subscription enforcement** thoroughly

### Fiscal Year Rules
- **Always use fiscalYearGuard** for write operations
- **Never allow modifications** to closed fiscal years
- **Validate fiscal year status** before allowing changes
- **Provide clear error messages** for fiscal year violations
- **Test fiscal year protection** thoroughly

## Consequences of Violating Rules

Violating these development rules may result in:
- **Broken existing functionality** due to unintended changes
- **Data integrity issues** from improper database operations
- **Security vulnerabilities** from improper security practices
- **Performance degradation** from inefficient implementations
- **Integration failures** from improper module interactions
- **Loss of project context** from incomplete documentation
- **Increased technical debt** from inconsistent implementations
- **Deployment failures** from inadequate testing

## Continuous Improvement

These rules should be:
- **Reviewed regularly** and updated as the project evolves
- **Enhanced** with lessons learned from development
- **Customized** based on project-specific requirements
- **Shared** with all developers working on the project
- **Enforced** through code review and testing processes

Remember: These rules exist to maintain code quality, system integrity, and development efficiency. Following them ensures the Bisonstechs ERP remains maintainable, secure, and reliable.