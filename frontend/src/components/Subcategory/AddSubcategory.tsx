import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
    Button,
    DialogActionTrigger,
    DialogTitle,
    Input,
    Text,
    VStack,
    NativeSelect,
  } from "@chakra-ui/react"

import { useState } from "react"
import { FaPlus } from "react-icons/fa"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import type { ApiError } from "../../client/core/ApiError"
import { type ItemCategoryCreate, ItemCategoryService } from "../../client"
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


import { ItemSubCategoryService } from "../../client";

// Define the types we need
interface ItemSubCategoryCreate {
  item_subcategory_name: string;
  item_subcategory_code: string;
  item_category_id: string;
  item_subcategory_isactive: boolean;
}

interface AddSubCategoryProps {
  preselectedCategoryId?: string;
}
const AddSubcategory = ({ preselectedCategoryId }: AddSubCategoryProps) =>{
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showSuccessToast } = useCustomToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ItemSubCategoryCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      item_subcategory_name: "",
      item_subcategory_code: "",
      item_category_id: preselectedCategoryId || "",
      item_subcategory_isactive: true
    },
  });

    // Fetch categories for dropdown
    const { data: categoriesResponse, isLoading: isCategoriesLoading } = useQuery({
      queryKey: ["categories"],
      queryFn: () => ItemCategoryService.readItemCategories(),
    });

      // Extract categories array from response 
    const categories = categoriesResponse?.data || [];


    const mutation = useMutation({
      mutationFn: (data: ItemSubCategoryCreate) =>
        ItemSubCategoryService.createItemSubcategory({ requestBody: data }),
      onSuccess: () => {
        showSuccessToast("Subcategory created successfully.");
        reset();
        setIsOpen(false);
      },
      onError: (err: ApiError) => {
        handleError(err);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      },
    });


    const onSubmit = (data: ItemSubCategoryCreate) => {
      mutation.mutate(data);
    };
    return (
      <DialogRoot
        size={{ base: "xs", md: "md" }}
        placement="center"
        open={isOpen}
        onOpenChange={({ open }) => setIsOpen(open)}
      >
        <DialogTrigger asChild>
          <Button value="add-subcategory" my={4}>
            <FaPlus fontSize="16px" />
            Add Subcategory
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Add Subcategory</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text mb={4}>Fill in the details to add a new Subcategory.</Text>
              <VStack gap={4}>
                <Field
                  required
                  invalid={!!errors.item_category_id}
                  errorText={errors.item_category_id?.message}
                  label="Parent Category"
                >
                  <NativeSelect.Root key="plain" variant="plain" >
                    <NativeSelect.Field placeholder="Select Category" {...register("item_category_id", {
                      required: "Parent category is required.",
                    })}>
                    {Array.isArray(categories) && categories.map((category) => (
                      <option key={category.item_category_id} value={category.item_category_id}>
                        {category.item_category_name}
                      </option>
                    ))}

                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field>

                <Field
                  required
                  invalid={!!errors.item_subcategory_name}
                  errorText={errors.item_subcategory_name?.message}
                  label="Subcategory Name"
                >
                  <Input
                    id="name"
                    {...register("item_subcategory_name", {
                      required: "Subcategory name is required.",
                    })}
                    placeholder="Subcategory Name"
                    type="text"
                  />
                </Field>

                <Field
                  invalid={!!errors.item_subcategory_code}
                  errorText={errors.item_subcategory_code?.message}
                  label="Subcategory Code"
                >
                  <Input
                    id="code"
                    {...register("item_subcategory_code")}
                    placeholder="Subcategory Code"
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
    );
  
}

export default AddSubcategory;