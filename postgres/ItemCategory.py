import psycopg2
from datetime import datetime
import uuid
def insert_item_category(connection_params, item_data):
    """
    Insert data into the itemcategory table
    
    Parameters:
    connection_params (dict): Database connection parameters
    item_data (dict): Data to insert into the table
    
    Returns:
    bool: True if insertion was successful, False otherwise
    """
    try:
        # Connect to the PostgreSQL database
        conn = psycopg2.connect(**connection_params)
       

        # Create a cursor
        cursor = conn.cursor()
        
        # Prepare the SQL query
        insert_query = """
        INSERT INTO public.itemcategory(
            item_category_isactive, item_category_id, item_category_name, 
            item_category_code, created_at, updated_at, created_by_id, updated_by_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """
         # Generate a UUID for the ID field if not provided
        if 'id' not in item_data:
            item_data['id'] = uuid.uuid4()
        # Convert UUID to string to avoid adaptation issues
        uuid_str = str(item_data['id'])
        # Execute the query with the data
        cursor.execute(insert_query, (
            item_data['is_active'],
            uuid_str,
            item_data['name'],
            item_data['code'],
            item_data.get('created_at', datetime.now()),
            item_data.get('updated_at', datetime.now()),
            item_data.get('created_by_id'),
            item_data.get('updated_by_id')
        ))
        
        # Commit the transaction
        conn.commit()
        
        print("Item category inserted successfully!")
        return True
        
    except (Exception, psycopg2.Error) as error:
        print(f"Error while connecting to PostgreSQL: {error}")
        return False
        
    finally:
        # Close the database connection
        if conn:
            cursor.close()
            conn.close()
            print("PostgreSQL connection is closed")

# Example usage
if __name__ == "__main__":
    # Database connection parameters
    db_params = {
        "host": "localhost",
        "database": "CIL",
        "user": "postgres",
        "password": "changeme",
        "port": "5432"
    }
    
    # Data to insert
    item_category = {
        "is_active": True,
        "name": "Electronics",
        "code": "ELEC-001",
        "created_by_id": 101,
        "updated_by_id": 101
        # created_at and updated_at will default to current time if not provided
    }
    item_category_list = [
        {
            "is_active": True,
            "name": "Sugars",
            "code": "Sugars",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Dairy Free",
            "code": "Non Dairy",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Dairy",
            "code": "Dairy",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Flour",
            "code": "Flour",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Oil",
            "code": "Oil",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Cuisine items",
            "code": "Cuisine",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
         {
            "is_active": True,
            "name": "Fruits &Vegetables",
            "code": "FruitsAndVegtables",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
         {
            "is_active": True,
            "name": "Spices",
            "code": "Spices",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
         {
            "is_active": True,
            "name": "Staple Dry",
            "code": "StapleDry",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Canned",
            "code": "Canned",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
         {
            "is_active": True,
            "name": "Extracts",
            "code": "Extracts",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Nuts",
            "code": "Nuts",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Cuisine Tech",
            "code": "CuisineTech",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Colorings",
            "code": "Colorings",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Misceallenous",
            "code": "Misceallenous",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Chocolate",
            "code": "Chocolate",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "Supply",
            "code": "Supply",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
         {
            "is_active": True,
            "name": "LATEX GLOVES",
            "code": "GLOVES",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
         {
            "is_active": True,
            "name": "CONTAINERS",
            "code": "CONTAINERS",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
        {
            "is_active": True,
            "name": "LIDS",
            "code": "LIDS",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
         {
            "is_active": True,
            "name": "Supply",
            "code": "Supply",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
          {
            "is_active": True,
            "name": "Frozen",
            "code": "Frozen",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
         {
            "is_active": True,
            "name": "Barry Choc. & Vanilla",
            "code": "Barry",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        },
          {
            "is_active": True,
            "name": "Alcohols",
            "code": "Alcohols",
            "created_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c',
            "updated_by_id": '7d4d39c1-1dd0-4020-9eb6-db6e14c8375c'
        }


    ]
    # Insert the data
    for item in item_category_list:
        insert_item_category(db_params, item)