# Issue Creator Reference

## Complete Example Session

**User:** `/create-issue Add dark mode support`

**Claude:**
1. Fetches project 19 configuration
2. Prompts for description:
   > "Provide the issue description:"
3. User enters: "Users need dark mode for better visibility in low-light conditions"
4. Fetches Type options: Bug, Feature, Tech Debt, Spike
5. Fetches Initiative options: User Experience, Performance, Tech Debt
6. Fetches Status options: Todo, In Progress, Done
7. Asks for Priority: **P2 (Medium)**
8. Asks for Type: **Feature**
9. Asks for Initiative: **User Experience**
10. Asks for Status: **Todo**
11. Creates issue: `gh issue create --title "Add dark mode support" --body "..."`
12. Adds to project 19
13. Sets Priority to P2, Type to Feature, Initiative to User Experience, Status to Todo
14. Displays confirmation:
    ```
    ## Issue Created

    **Title:** Add dark mode support
    **URL:** https://github.com/atypical-ai/repo/issues/42

    **Project Assignment:**
    - Added to: ExamJam V.Next 25 (Project #19)
    - Priority: P2
    - Type: Feature
    - Initiative: User Experience
    - Status: Todo
    ```

## Customization

To adapt this skill for a different organization or project:

1. **Update Target Project** - Change the organization and project number in the "Target Project" section
2. **Modify Field Names** - Update the field names (Priority, Type, Initiative, Status) to match your project's custom fields
3. **Adjust Priority Options** - If your project uses different priority levels, update the Priority options in Step 3

Example for a different project:
```bash
# Replace these values throughout the skill:
ORGANIZATION="your-org"
PROJECT_NUMBER="42"

# Then use:
gh project view $PROJECT_NUMBER --owner $ORGANIZATION --format json
gh project field-list $PROJECT_NUMBER --owner $ORGANIZATION --format json
```

## Notes

- All IDs are GraphQL node IDs (base64-encoded strings)
- The `--jq` flag filters JSON output directly
- Heredocs (`<<'EOF'`) prevent shell interpretation of special characters in issue body
