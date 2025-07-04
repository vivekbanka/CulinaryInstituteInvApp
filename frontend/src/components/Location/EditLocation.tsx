import {
    Button,
    ButtonGroup,
    DialogActionTrigger,
    Input,
    Text,
    Textarea,
    VStack,
  } from "@chakra-ui/react"
  import { useMutation, useQueryClient } from "@tanstack/react-query"
  import { useState } from "react"
  import { type SubmitHandler, useForm } from "react-hook-form"
  import { FaExchangeAlt } from "react-icons/fa"
  
  import { type ApiError, type LocationsPublic, LocationService, LocationsUpdate } from "../../client"
  import useCustomToast from "../../hooks/useCustomToast"
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

  
  interface EditLocationProps {
    location: LocationsPublic
  }
  
  interface EditLocationForm {
    location_name: string
  }
  
  const EditLocation = ({ location }: EditLocationProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()
    const { showSuccessToast } = useCustomToast()
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting },
    } = useForm<EditLocationForm>({
      mode: "onBlur",
      criteriaMode: "all",
      defaultValues: {
        ...location
      },
    })
  
    const mutation = useMutation({
      mutationFn: (data: LocationsUpdate) =>
        LocationService.updateLocation({ id: location.location_id, requestBody: data }),
      onSuccess: () => {
        showSuccessToast("Location updated successfully.")
        reset()
        setIsOpen(false)
      },
      onError: (err: ApiError) => {
        handleError(err)
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["location"] })
      },
    })
  
    const onSubmit: SubmitHandler<EditLocationForm> = async (data) => {
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
            Edit Location
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Location</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text mb={4}>Update the Location details below.</Text>
              <VStack gap={4}>
                <Field
                  required
                  invalid={!!errors.location_name}
                  errorText={errors.location_name?.message}
                  label="Location Name"
                >
                  <Input
                    id="locationName"
                    {...register("location_name", {
                      required: "Location name is required",
                    })}
                    placeholder="location Name"
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
  
  export default EditLocation