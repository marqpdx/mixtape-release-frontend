

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Input, Text } from "@chakra-ui/react";
import { useController, Control } from "react-hook-form";


type DatePickerInputProps = {
  name: string;
  control: Control<any>;
  label?: string;
  isRequired?: boolean;
  placeholder?: string;
  validateFn?: (value: Date | null) => string | boolean;
};

export const DatePickerInput = ({
  name,
  control,
  placeholder,
  isRequired = false,
  validateFn,
}: DatePickerInputProps) => {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules: {
      required: isRequired ? "This field is required" : false,
      validate: validateFn,
    },
  });

  return (
    <>
      <DatePicker
        selected={value ? new Date(value) : null}
        onChange={onChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="yyyy-MM-dd HH:mm"
        placeholderText={'Please select a date'}
        customInput={<Input color={'blue.500'} placeholder={placeholder} />}
      />
      {error?.message && (
        <Text color="red.500" fontSize="sm" mt={1}>
          {error.message as string}
        </Text>
      )}
    </>
  );
};





// type DatePickerInputProps = {
//   name: string;
//   control: Control<any>;
//   label?: string;
//   isRequired?: boolean;
//   placeholder?: string;
// };

// export const DatePickerInput = ({
//   name,
//   control,
//   placeholder,
//   isRequired = false,
// }: DatePickerInputProps) => {
//   const {
//     field: { onChange, value },
//     fieldState: { error },
//   } = useController({
//     name,
//     control,
//     rules: isRequired
//       ? { required: "This field is required" }
//       : undefined,
//   });

//   return (
//     <>
//       <DatePicker
//         selected={value ? new Date(value) : null}
//         onChange={onChange}
//         showTimeSelect
//         timeFormat="HH:mm"
//         timeIntervals={15}
//         dateFormat="yyyy-MM-dd HH:mm"
//         customInput={<Input placeholder={placeholder} />}
//       />
//       {error?.message && (
//         <Text color="red.500" fontSize="sm" mt={1}>
//           {error.message as string}
//         </Text>
//       )}
//     </>
//   );
// };
