import HelpCenter from '@mui/icons-material/HelpCenter'
import AddToHomeScreenIcon from '@mui/icons-material/AddToHomeScreen'
import FindInPageIcon from '@mui/icons-material/FindInPage'
import Autocomplete from '@mui/material/Autocomplete'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import capitalize from 'lodash/fp/capitalize'
import React, { FC, useEffect } from 'react'
import { updateField, updateFieldAutoComplete } from './utils'
import { CommandArgFieldProps } from '../types'
import languageMap from 'browser/I18N/keys'
import { useIntl } from 'react-intl'

type PluralField = 'targets' | 'values'

const CommandLocatorField: FC<CommandArgFieldProps> = ({
  command,
  disabled,
  fieldName,
  testID,
}) => {
  const intl = useIntl()
  const fieldNames = (fieldName + 's') as PluralField
  const FieldName = capitalize(fieldName)

  const updateTarget = updateField(fieldName)
  const updateTargetAutoComplete = updateFieldAutoComplete(fieldName)
  const [localValue, setLocalValue] = React.useState(command[fieldName])
  
  const onChange = (e: any) => {
    setLocalValue(e)
    updateTarget(testID, command.id)(e)
  }
  
  const onChangeAutoComplete = (e: any, value: string) => {
    setLocalValue(value)
    updateTargetAutoComplete(testID, command.id)(e, value)
  }
  
  // Handle blur event to save the value when user clicks away
  const onBlur = () => {
    if (localValue !== command[fieldName]) {
      window.sideAPI.tests.updateStep(testID, command.id, {
        [fieldName]: localValue || "",
      })
    }
  }
  
  useEffect(() => {
    setLocalValue(command[fieldName])
  }, [command.id])

  // 处理label标签
  const handleLabel = (value: string) => {
    switch (value) {
      case 'Comment':
        return intl.formatMessage({ id: languageMap.testCore.comment })
      case 'Target':
        return intl.formatMessage({ id: languageMap.testCore.target })
      case 'Value':
        return intl.formatMessage({ id: languageMap.testCore.value })
      default:
        return value
    }
  }

  // First try to get the description from command field descriptions, if not found fall back to command description
  let fullNote = ''
  try {
    fullNote = intl.formatMessage({
      id: `commandFieldDescriptions.${command.command}.${fieldName}.description`,
      defaultMessage: '' // Return empty string if not found
    })
    
    // If the specific field description wasn't found, fall back to general command description
    if (!fullNote) {
      fullNote = intl.formatMessage({
        id: `commandMap.${command.command}.description`,
        defaultMessage: '' // Return empty string if not found
      })
    }
  } catch (e) {
    console.warn(`Missing translation for command ${command.command}, field ${fieldName}:`, e)
  }

  const label = fullNote
    ? handleLabel(FieldName) + ' - ' + fullNote
    : handleLabel(FieldName)

  return (
    <FormControl className="flex flex-row">
      <Autocomplete
        className="flex-1"
        disabled={disabled}
        freeSolo
        inputValue={localValue || ''}
        componentsProps={{
          paper: {
            sx: {
              zIndex: 3000,
            },
          },
        }}
        onChange={(_event: any, newValue: string | null) => {
          onChange(newValue)
        }}
        onBlur={onBlur}
        onContextMenu={() => {
          window.sideAPI.menus.open('textField')
        }}
        onInputChange={(event, newInputValue) => {
          onChangeAutoComplete(event, newInputValue)
        }}
        options={(command[fieldNames] ?? []).map((entry) => entry[0])}
        renderInput={(params) => (
          <TextField
            {...params}
            inputProps={{
              ...params.inputProps,
              ['data-overridearrowkeys']: true,
            }}
            label={label}
            name={fieldName}
          />
        )}
        size="small"
        text-overflow="ellipsis"
        value={localValue || ''}
      />
      <IconButton
        className="ms-4"
        disabled={disabled}
        onClick={() =>
          window.sideAPI.recorder.requestHighlightElement(fieldName)
        }
      >
        <FindInPageIcon />
      </IconButton>
      <IconButton
        disabled={disabled}
        onClick={() =>
          window.sideAPI.recorder.requestSelectElement(true, fieldName)
        }
      >
        <AddToHomeScreenIcon />
      </IconButton>
      <Tooltip className="mx-2 my-auto" title={fullNote} placement="top-end">
        <HelpCenter />
      </Tooltip>
    </FormControl>
  )
}

export default CommandLocatorField
