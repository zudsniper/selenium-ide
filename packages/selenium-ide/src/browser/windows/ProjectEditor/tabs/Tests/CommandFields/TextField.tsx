import FormControl from '@mui/material/FormControl'
import HelpCenter from '@mui/icons-material/HelpCenter'
import TextField from 'browser/components/UncontrolledTextField'
import startCase from 'lodash/fp/startCase'
import React, { FC } from 'react'
import { CommandFieldProps } from '../types'
import { updateField } from './utils'
import Tooltip from '@mui/material/Tooltip'
import { LocatorFields } from '@seleniumhq/side-api'
import { useIntl } from 'react-intl'
import languageMap from 'browser/I18N/keys'

const inputLabelProps = {
  sx: {
    textOverflow: 'ellipsis',
  },
}

const CommandTextField: FC<CommandFieldProps> = ({
  command,
  disabled,
  fieldName,
  note,
  testID,
}) => {
  const intl = useIntl()
  const FieldName = startCase(fieldName)
  const updateText = updateField(fieldName)
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
  let fullNote = note
  try {
    fullNote = note || intl.formatMessage({
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
      <TextField
        className="flex-1"
        disabled={disabled}
        id={`${fieldName}-${command.id}`}
        label={label}
        InputLabelProps={inputLabelProps}
        name={fieldName}
        onChange={updateText(testID, command.id)}
        onContextMenu={() => {
          window.sideAPI.menus.open('textField')
        }}
        size="small"
        value={command[fieldName as LocatorFields]}
      />
      {fullNote && (
        <Tooltip className="mx-2 my-auto" title={fullNote} placement="top-end">
          <HelpCenter />
        </Tooltip>
      )}
    </FormControl>
  )
}

export default CommandTextField
