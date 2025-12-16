import {
    Button,
    ButtonGroup,
    DialogActionTrigger,
    Input,
    Text,
    VStack,
  } from "@chakra-ui/react"
  import { useMutation, useQueryClient } from "@tanstack/react-query"
  import { useState } from "react"
  import { type SubmitHandler, useForm } from "react-hook-form"
  import { FaExchangeAlt } from "react-icons/fa"
  
  import { type ApiError, type   CoursesPublic, CourseService, CoursesUpdate } from "../../client"
  import useCustomToast from  "../../hooks/useCustomToast"
  import { handleError } from "../../utils"
  import {
    DialogBody,
    DialogCloseTrigger,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogRoot,
    DialogTitle,
    DialogTrigger,
  } from "../ui/dialog"
  import { Field } from "../ui/field"

  
  interface EditItemProps {
    item: CoursesPublic
  }
  
  interface CourseUpdate {
    course_name: string
    course_description?: string
  }

  const EditCourse = ({ item }: EditItemProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const { showSuccessToast } = useCustomToast()
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting },
    } = useForm<CourseUpdate>({
      mode: "onBlur",
      criteriaMode: "all",
      defaultValues: {
        ...item,
        course_name: item.course_name ?? undefined,
        course_description: item.course_description ?? undefined,
      },
    })
  
    const mutation = useMutation({
      mutationFn: (data:  CoursesUpdate) =>
        CourseService.updateCourse({ id: item.course_id, requestBody: data }),
      onSuccess: () => {
        showSuccessToast("Course updated successfully.")
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
  
    const onSubmit: SubmitHandler<CoursesUpdate> = async (data) => {
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
          <Button variant="ghost">
            <FaExchangeAlt fontSize="16px" />
            Edit Item
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Course </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text mb={4}>Update the Course details below.</Text>
              <VStack gap={4}>
                <Field
                  required
                  invalid={!!errors.course_name}
                  errorText={errors.course_name?.message}
                  label="Course Name"
                >
                  <Input
                    id="CourseName"
                    {...register("course_name", {
                      required: "Title is required",
                    })}
                    placeholder="Title"
                    type="text"
                  />
                </Field>
  
                <Field
                  invalid={!!errors.course_description}
                  errorText={errors.course_description?.message}
                  label="Description"
                >
                  <Input
                    id="CourseDescription"
                    {...register("course_description")}
                    placeholder="Description"
                    type="text"
                  />
                </Field>
              </VStack>
            </DialogBody>
  
            <DialogFooter gap={2}>
              <ButtonGroup>
                <DialogActionTrigger asChild>
                  <Button
                    variant="subtle"
                    colorPalette="gray"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </DialogActionTrigger>
                <Button variant="solid" type="submit" loading={isSubmitting}>
                  Save
                </Button>
              </ButtonGroup>
            </DialogFooter>
          </form>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    )
  }

  export default EditCourse
  