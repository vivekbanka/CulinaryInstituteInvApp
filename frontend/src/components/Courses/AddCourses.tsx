import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
    Button,
    DialogActionTrigger,
    DialogTitle,
    Input,
    Text,
    VStack,
} from "@chakra-ui/react"

import { useState } from "react"
import { FaPlus } from "react-icons/fa"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import type { ApiError } from "../../client/core/ApiError"
import { type CoursesCreate, CourseService } from "../../client"
import {
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

const AddCourse = () => {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const { showSuccessToast } = useCustomToast()
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isValid, isSubmitting },
    } = useForm<CoursesCreate>({
        mode: "onBlur",
        criteriaMode: "all",
        defaultValues: {
            course_name: "",
            course_description: "",
            is_active: true
        },
    })

    const mutation = useMutation({
        mutationFn: (data: CoursesCreate) =>
            CourseService.createCourse({ requestBody: data }),
        onSuccess: () => {
            showSuccessToast("Course created successfully.")
            reset()
            setIsOpen(false)
        },
        onError: (err: ApiError) => {
            handleError(err)
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["items"] })
        },
    })

    const onSubmit: SubmitHandler<CoursesCreate> = (data) => {
        mutation.mutate(data)
    }
        return (
      <DialogRoot
        size={{ base: "xs", md: "md" }}
        placement="center"
        open={isOpen}
        onOpenChange={({ open }) => setIsOpen(open)}
      >
        <DialogTrigger asChild>
          <Button value="add-item" my={4}>
            <FaPlus fontSize="16px" />
            Add Course
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Course</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text mb={4}>Fill in the details to add a new Course.</Text>
              <VStack gap={4}>
                <Field
                  required
                  invalid={!!errors.course_description}
                  errorText={errors.course_description?.message}
                  label="Course Description"
                >
                  <Input
                    id="title"
                    {...register("course_description", {
                      required: "Course description is required.",
                    })}
                    placeholder="Course Description"
                    type="text"
                  />
                </Field>
  
                <Field
                  invalid={!!errors.course_name}
                  errorText={errors.course_name?.message}
                  label="Course Name"
                >
                  <Input
                    id="description"
                    {...register("course_name", {
                      required: "Course name is required.",
                    })}
                    placeholder="Course Name"
                    type="text"
                  />
                </Field>
              </VStack>
            </DialogBody>
  
            <DialogFooter gap={2}>
              <DialogActionTrigger asChild>
                <Button
                  variant="subtle"
                  colorPalette="gray"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button
                variant="solid"
                type="submit"
                disabled={!isValid}
                loading={isSubmitting}
              >
                Save
              </Button>
            </DialogFooter>
          </form>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    )
}

export default AddCourse